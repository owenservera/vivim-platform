import * as Y from 'yjs';
import type { CRDTSyncService } from './CRDTSyncService.js';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('crdt:circle');

export interface CircleMember {
  id: string;
  did: string;
  displayName: string;
  avatar?: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: number;
  permissions: {
    read: boolean;
    write: boolean;
    invite: boolean;
    remove: boolean;
  };
}

export interface CircleSettings {
  visibility: 'private' | 'circle' | 'public';
  sharingPolicy: 'owner-only' | 'moderators' | 'all-members';
  syncMode: 'realtime' | 'periodic' | 'manual';
  encryption: boolean;
  maxMembers?: number;
}

export class CircleCRDT {
  private doc: Y.Doc;
  private docId: string;
  private syncService: CRDTSyncService;

  constructor(docId: string, syncService: CRDTSyncService) {
    this.docId = docId;
    this.syncService = syncService;
    this.doc = syncService.getDocument(docId) || new Y.Doc();
  }

  async initialize(): Promise<void> {
    await this.syncService.createDocument({
      docId: this.docId,
      docType: 'circle',
      p2pEnabled: true,
      signalingServers: ['wss://signaling.vivim.net'],
    });
    this.doc = this.syncService.getDocument(this.docId)!;
    this.setupHandlers();
    log.info({ docId: this.docId }, 'CircleCRDT initialized');
  }

  private setupHandlers(): void {
    const name = this.doc.get('name') as Y.Text;
    const description = this.doc.get('description') as Y.Text;
    const members = this.doc.getMap<CircleMember>('members');
    const settings = this.doc.getMap('settings');
    const contentRefs = this.doc.getArray<{ type: string; id: string }>('contentRefs');

    name.observe(() => {
      this.emit('name:change', name.toString());
    });

    description.observe(() => {
      this.emit('description:change', description.toString());
    });

    members.observe(() => {
      const memberList: CircleMember[] = [];
      members.forEach((value) => memberList.push(value as CircleMember));
      this.emit('members:change', memberList);
    });

    settings.observe(() => {
      const circleSettings: CircleSettings = {} as CircleSettings;
      settings.forEach((value, key) => {
        (circleSettings as Record<string, unknown>)[key] = value;
      });
      this.emit('settings:change', circleSettings);
    });

    contentRefs.observe(() => {
      this.emit('content:change', contentRefs.toArray());
    });
  }

  getName(): string {
    const name = this.doc.get('name') as Y.Text;
    return name.toString();
  }

  setName(name: string): void {
    const yName = this.doc.get('name') as Y.Text;
    yName.delete(0, yName.length);
    yName.insert(0, name);
  }

  getDescription(): string {
    const description = this.doc.get('description') as Y.Text;
    return description.toString();
  }

  setDescription(description: string): void {
    const yDesc = this.doc.get('description') as Y.Text;
    yDesc.delete(0, yDesc.length);
    yDesc.insert(0, description);
  }

  getMembers(): CircleMember[] {
    const members = this.doc.getMap<CircleMember>('members');
    const result: CircleMember[] = [];
    members.forEach((value) => result.push(value));
    return result;
  }

  addMember(member: CircleMember): void {
    const members = this.doc.getMap<CircleMember>('members');
    members.set(member.id, member);
    log.debug({ docId: this.docId, memberId: member.id }, 'Member added');
  }

  removeMember(memberId: string): void {
    const members = this.doc.getMap<CircleMember>('members');
    members.delete(memberId);
    log.debug({ docId: this.docId, memberId }, 'Member removed');
  }

  updateMember(memberId: string, updates: Partial<CircleMember>): void {
    const members = this.doc.getMap<CircleMember>('members');
    const existing = members.get(memberId);
    if (existing) {
      members.set(memberId, { ...existing, ...updates });
    }
  }

  getSettings(): CircleSettings {
    const settings = this.doc.getMap('settings');
    const result: CircleSettings = {
      visibility: (settings.get('visibility') as CircleSettings['visibility']) || 'private',
      sharingPolicy: (settings.get('sharingPolicy') as CircleSettings['sharingPolicy']) || 'owner-only',
      syncMode: (settings.get('syncMode') as CircleSettings['syncMode']) || 'realtime',
      encryption: (settings.get('encryption') as boolean) ?? true,
      maxMembers: settings.get('maxMembers') as number | undefined,
    };
    return result;
  }

  updateSettings(updates: Partial<CircleSettings>): void {
    const settings = this.doc.getMap('settings');
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        settings.set(key, value);
      }
    }
  }

  getContentRefs(): Array<{ type: string; id: string }> {
    const contentRefs = this.doc.getArray<{ type: string; id: string }>('contentRefs');
    return contentRefs.toArray();
  }

  addContentRef(type: string, id: string): void {
    const contentRefs = this.doc.getArray<{ type: string; id: string }>('contentRefs');
    const existing = contentRefs.toArray();
    if (!existing.some((ref) => ref.type === type && ref.id === id)) {
      contentRefs.push([{ type, id }]);
    }
  }

  removeContentRef(type: string, id: string): void {
    const contentRefs = this.doc.getArray<{ type: string; id: string }>('contentRefs');
    const index = contentRefs.toArray().findIndex((ref) => ref.type === type && ref.id === id);
    if (index !== -1) {
      contentRefs.delete(index, 1);
    }
  }

  private emit(event: string, data: unknown): void {
    log.debug({ docId: this.docId, event }, 'Emitting event');
  }
}
