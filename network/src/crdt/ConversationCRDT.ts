import * as Y from 'yjs';
import type { CRDTSyncService } from './CRDTSyncService.js';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('crdt:conversation');

export interface Message {
  id: string;
  authorId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, unknown>;
}

export interface Participant {
  id: string;
  did: string;
  displayName: string;
  avatar?: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: number;
}

export class ConversationCRDT {
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
      docType: 'conversation',
      p2pEnabled: true,
      signalingServers: ['wss://signaling.vivim.net'],
    });
    this.doc = this.syncService.getDocument(this.docId)!;
    this.setupHandlers();
    log.info({ docId: this.docId }, 'ConversationCRDT initialized');
  }

  private setupHandlers(): void {
    const title = this.doc.get('title') as Y.Text;
    const messages = this.doc.getArray<Message>('messages');
    const participants = this.doc.getMap<Participant>('participants');
    const metadata = this.doc.getMap('metadata');

    title.observe(() => {
      this.emit('title:change', title.toString());
    });

    messages.observe(() => {
      this.emit('messages:change', messages.toArray());
    });

    participants.observe(() => {
      const parts: Participant[] = [];
      participants.forEach((value) => parts.push(value as Participant));
      this.emit('participants:change', parts);
    });

    metadata.observe(() => {
      const meta: Record<string, unknown> = {};
      metadata.forEach((value, key) => {
        meta[key] = value;
      });
      this.emit('metadata:change', meta);
    });
  }

  getTitle(): string {
    const title = this.doc.get('title') as Y.Text;
    return title.toString();
  }

  setTitle(title: string): void {
    const yTitle = this.doc.get('title') as Y.Text;
    yTitle.delete(0, yTitle.length);
    yTitle.insert(0, title);
  }

  getMessages(): Message[] {
    const messages = this.doc.getArray<Message>('messages');
    return messages.toArray();
  }

  addMessage(message: Message): void {
    const messages = this.doc.getArray<Message>('messages');
    messages.push([message]);
    log.debug({ docId: this.docId, messageId: message.id }, 'Message added');
  }

  deleteMessage(messageId: string): void {
    const messages = this.doc.getArray<Message>('messages');
    const index = messages.toArray().findIndex((m) => m.id === messageId);
    if (index !== -1) {
      messages.delete(index, 1);
    }
  }

  getParticipants(): Participant[] {
    const participants = this.doc.getMap<Participant>('participants');
    const result: Participant[] = [];
    participants.forEach((value) => result.push(value));
    return result;
  }

  addParticipant(participant: Participant): void {
    const participants = this.doc.getMap<Participant>('participants');
    participants.set(participant.id, participant);
  }

  removeParticipant(participantId: string): void {
    const participants = this.doc.getMap<Participant>('participants');
    participants.delete(participantId);
  }

  updateParticipant(participantId: string, updates: Partial<Participant>): void {
    const participants = this.doc.getMap<Participant>('participants');
    const existing = participants.get(participantId);
    if (existing) {
      participants.set(participantId, { ...existing, ...updates });
    }
  }

  getMetadata<T = Record<string, unknown>>(): T {
    const metadata = this.doc.getMap('metadata');
    const result: Record<string, unknown> = {};
    metadata.forEach((value, key) => {
      result[key] = value;
    });
    return result as T;
  }

  setMetadata(key: string, value: unknown): void {
    const metadata = this.doc.getMap('metadata');
    metadata.set(key, value);
  }

  private emit(event: string, data: unknown): void {
    log.debug({ docId: this.docId, event }, 'Emitting event');
  }
}
