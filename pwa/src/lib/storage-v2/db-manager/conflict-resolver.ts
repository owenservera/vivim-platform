import { log } from '../../logger';

export type ConflictStrategy = 'local_wins' | 'remote_wins' | 'newest_wins' | 'merge' | 'manual';
export type ConflictType = 'update_update' | 'update_delete' | 'delete_update' | 'delete_delete';

export interface ConflictRecord {
  id: string;
  entityType: string;
  entityId: string;
  localVersion: EntityVersion;
  remoteVersion: EntityVersion;
  conflictType: ConflictType;
  detectedAt: string;
  resolved?: boolean;
  resolution?: string;
}

export interface EntityVersion {
  data: unknown;
  timestamp: number;
  version: number;
  source: 'local' | 'remote';
}

export interface ConflictResolution {
  strategy: ConflictStrategy;
  result: unknown;
  merged?: boolean;
  resolvedAt: string;
  notes?: string;
}

export class ConflictResolver {
  private conflictListeners: Set<(conflict: ConflictRecord) => void> = new Set();
  private manualResolutions: Map<string, ConflictResolution> = new Map();

  detectConflict(
    local: EntityVersion,
    remote: EntityVersion,
    entityType: string,
    entityId: string
  ): ConflictRecord | null {
    if (local.version === remote.version) {
      return null;
    }

    const localData = local.data as Record<string, unknown>;
    const remoteData = remote.data as Record<string, unknown>;

    let conflictType: ConflictType;

    if (!localData && remoteData) {
      conflictType = 'delete_update';
    } else if (localData && !remoteData) {
      conflictType = 'update_delete';
    } else if (!localData && !remoteData) {
      conflictType = 'delete_delete';
    } else {
      conflictType = 'update_update';
    }

    const conflict: ConflictRecord = {
      id: `${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      localVersion: local,
      remoteVersion: remote,
      conflictType,
      detectedAt: new Date().toISOString(),
    };

    log.storage.warn('Conflict detected', {
      entityType,
      entityId,
      conflictType,
    });

    return conflict;
  }

  resolve(
    conflict: ConflictRecord,
    strategy?: ConflictStrategy
  ): ConflictResolution {
    const manualKey = `${conflict.entityType}_${conflict.entityId}`;
    const manual = this.manualResolutions.get(manualKey);
    
    if (manual) {
      this.manualResolutions.delete(manualKey);
      return manual;
    }

    const resolved = this.doResolve(conflict, strategy || this.guessStrategy(conflict));
    
    this.notifyListeners(conflict);
    
    return resolved;
  }

  private doResolve(conflict: ConflictRecord, strategy: ConflictStrategy): ConflictResolution {
    switch (strategy) {
      case 'local_wins':
        return {
          strategy: 'local_wins',
          result: conflict.localVersion.data,
          resolvedAt: new Date().toISOString(),
          notes: 'Local version selected',
        };

      case 'remote_wins':
        return {
          strategy: 'remote_wins',
          result: conflict.remoteVersion.data,
          resolvedAt: new Date().toISOString(),
          notes: 'Remote version selected',
        };

      case 'newest_wins':
        const winner =
          conflict.localVersion.timestamp > conflict.remoteVersion.timestamp
            ? conflict.localVersion
            : conflict.remoteVersion;
        return {
          strategy: 'newest_wins',
          result: winner.data,
          resolvedAt: new Date().toISOString(),
          notes: `Selected ${winner.source} version (newest)`,
        };

      case 'merge':
        return this.mergeVersions(conflict);

      case 'manual':
        return {
          strategy: 'manual',
          result: null,
          resolvedAt: new Date().toISOString(),
          notes: 'Requires manual resolution',
        };

      default:
        return {
          strategy: 'newest_wins',
          result:
            conflict.localVersion.timestamp > conflict.remoteVersion.timestamp
              ? conflict.localVersion.data
              : conflict.remoteVersion.data,
          resolvedAt: new Date().toISOString(),
        };
    }
  }

  private mergeVersions(conflict: ConflictRecord): ConflictResolution {
    const localData = conflict.localVersion.data as Record<string, unknown>;
    const remoteData = conflict.remoteVersion.data as Record<string, unknown>;

    if (!localData || !remoteData) {
      return {
        strategy: 'merge',
        result: localData || remoteData,
        merged: false,
        resolvedAt: new Date().toISOString(),
        notes: 'One version was deleted, keeping the non-deleted version',
      };
    }

    const merged: Record<string, unknown> = {};
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);

    for (const key of allKeys) {
      const localValue = localData[key];
      const remoteValue = remoteData[key];

      if (localValue === remoteValue) {
        merged[key] = localValue;
      } else if (localValue === undefined) {
        merged[key] = remoteValue;
      } else if (remoteValue === undefined) {
        merged[key] = localValue;
      } else if (typeof localValue === 'object' && typeof remoteValue === 'object') {
        merged[key] = this.deepMerge(
          localValue as Record<string, unknown>,
          remoteValue as Record<string, unknown>
        );
      } else {
        const localTimestamp = (localData[`${key}_timestamp`] as number) || 0;
        const remoteTimestamp = (remoteData[`${key}_timestamp`] as number) || 0;
        
        merged[key] = localTimestamp > remoteTimestamp ? localValue : remoteValue;
      }
    }

    return {
      strategy: 'merge',
      result: merged,
      merged: true,
      resolvedAt: new Date().toISOString(),
      notes: 'Fields merged based on timestamps',
    };
  }

  private deepMerge(local: Record<string, unknown>, remote: Record<string, unknown>): unknown {
    const result: Record<string, unknown> = { ...local };

    for (const key of Object.keys(remote)) {
      if (!(key in result)) {
        result[key] = remote[key];
      } else if (
        typeof result[key] === 'object' &&
        result[key] !== null &&
        typeof remote[key] === 'object' &&
        remote[key] !== null
      ) {
        result[key] = this.deepMerge(
          result[key] as Record<string, unknown>,
          remote[key] as Record<string, unknown>
        );
      }
    }

    return result;
  }

  private guessStrategy(conflict: ConflictRecord): ConflictStrategy {
    switch (conflict.conflictType) {
      case 'delete_delete':
        return 'newest_wins';
      case 'delete_update':
        return 'remote_wins';
      case 'update_delete':
        return 'local_wins';
      case 'update_update':
        if (this.isSafeToMerge(conflict)) {
          return 'merge';
        }
        return 'newest_wins';
      default:
        return 'newest_wins';
    }
  }

  private isSafeToMerge(conflict: ConflictRecord): boolean {
    const localData = conflict.localVersion.data as Record<string, unknown>;
    const remoteData = conflict.remoteVersion.data as Record<string, unknown>;

    if (!localData || !remoteData) {
      return false;
    }

    const localKeys = Object.keys(localData);
    const remoteKeys = Object.keys(remoteData);
    const overlap = localKeys.filter(k => remoteKeys.includes(k));

    const totalFields = new Set([...localKeys, ...remoteKeys]).size;
    const overlapRatio = overlap.length / totalFields;

    return overlapRatio > 0.7;
  }

  setManualResolution(
    entityType: string,
    entityId: string,
    resolution: ConflictResolution
  ): void {
    const key = `${entityType}_${entityId}`;
    this.manualResolutions.set(key, resolution);
  }

  onConflict(listener: (conflict: ConflictRecord) => void): () => void {
    this.conflictListeners.add(listener);
    return () => this.conflictListeners.delete(listener);
  }

  private notifyListeners(conflict: ConflictRecord): void {
    this.conflictListeners.forEach(listener => listener(conflict));
  }

  resolveBatch(
    conflicts: ConflictRecord[],
    strategy?: ConflictStrategy
  ): Map<string, ConflictResolution> {
    const results = new Map<string, ConflictResolution>();

    for (const conflict of conflicts) {
      const resolution = this.resolve(conflict, strategy);
      results.set(conflict.id, resolution);
    }

    return results;
  }
}
