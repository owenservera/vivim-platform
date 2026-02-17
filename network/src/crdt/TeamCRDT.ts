import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('crdt:team');

export interface TeamMemberData {
  id: string;
  userDid: string;
  displayName: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  title?: string;
  notifyAll: boolean;
  notifyMentions: boolean;
  messageCount: number;
  lastActiveAt?: number;
  joinedAt: number;
  metadata: Record<string, unknown>;
}

export interface ChannelData {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  sortOrder: number;
  memberCount: number;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export interface ChannelMessageData {
  id: string;
  channelId: string;
  authorDid: string;
  content: string;
  contentType: string;
  parentId?: string;
  editedAt?: number;
  reactions: Record<string, string[]>;
  createdAt: number;
  metadata: Record<string, unknown>;
}

export interface TeamSettings {
  visibility: 'open' | 'invite';
  type: 'work' | 'project' | 'personal';
  allowGuestAccess: boolean;
  requireApproval: boolean;
  maxMembers?: number;
}

export class TeamCRDT {
  private doc: Y.Doc;
  private docId: string;

  constructor(docId: string) {
    this.docId = docId;
    this.doc = new Y.Doc();
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  getDocId(): string {
    return this.docId;
  }

  getName(): string {
    const name = this.doc.get('name') as Y.Text;
    return name ? name.toString() : '';
  }

  setName(name: string): void {
    const map = this.doc.getMap('teamData');
    const yName = map.get('name') as Y.Text;
    if (!yName) {
      const newName = new Y.Text();
      newName.insert(0, name);
      map.set('name', newName);
    } else {
      yName.delete(0, yName.length);
      yName.insert(0, name);
    }
  }

  getDescription(): string {
    const desc = this.doc.get('description') as Y.Text;
    return desc ? desc.toString() : '';
  }

  setDescription(description: string): void {
    const map = this.doc.getMap('teamData');
    const yDesc = map.get('description') as Y.Text;
    if (!yDesc) {
      const newDesc = new Y.Text();
      newDesc.insert(0, description);
      map.set('description', newDesc);
    } else {
      yDesc.delete(0, yDesc.length);
      yDesc.insert(0, description);
    }
  }

  getMembers(): TeamMemberData[] {
    const members = this.doc.getMap<TeamMemberData>('members');
    const result: TeamMemberData[] = [];
    members.forEach((value) => result.push(value));
    return result;
  }

  addMember(member: TeamMemberData): void {
    const members = this.doc.getMap<TeamMemberData>('members');
    members.set(member.id, member);
    log.info({ memberId: member.id, role: member.role }, 'Member added to team');
  }

  removeMember(memberId: string): void {
    const members = this.doc.getMap<TeamMemberData>('members');
    members.delete(memberId);
    log.info({ memberId }, 'Member removed from team');
  }

  updateMemberRole(memberId: string, role: TeamMemberData['role']): void {
    const members = this.doc.getMap<TeamMemberData>('members');
    const member = members.get(memberId);
    if (member) {
      members.set(memberId, { ...member, role });
    }
  }

  updateMemberTitle(memberId: string, title: string): void {
    const members = this.doc.getMap<TeamMemberData>('members');
    const member = members.get(memberId);
    if (member) {
      members.set(memberId, { ...member, title });
    }
  }

  getMember(did: string): TeamMemberData | undefined {
    return this.getMembers().find(m => m.userDid === did);
  }

  isMember(did: string): boolean {
    return this.getMembers().some(m => m.userDid === did);
  }

  isOwner(did: string): boolean {
    const member = this.getMember(did);
    return member?.role === 'owner';
  }

  isAdmin(did: string): boolean {
    const member = this.getMember(did);
    return member?.role === 'owner' || member?.role === 'admin';
  }

  getChannels(): ChannelData[] {
    const channels = this.doc.getArray<ChannelData>('channels');
    return channels.toArray().sort((a, b) => a.sortOrder - b.sortOrder);
  }

  addChannel(channel: ChannelData): void {
    const channels = this.doc.getArray<ChannelData>('channels');
    channels.push([channel]);
    log.info({ channelId: channel.id }, 'Channel added to team');
  }

  removeChannel(channelId: string): void {
    const channels = this.doc.getArray<ChannelData>('channels');
    const index = channels.toArray().findIndex(c => c.id === channelId);
    if (index !== -1) {
      channels.delete(index, 1);
      log.info({ channelId }, 'Channel removed from team');
    }
  }

  getChannel(channelId: string): ChannelData | undefined {
    return this.getChannels().find(c => c.id === channelId);
  }

  getMessages(channelId: string): ChannelMessageData[] {
    const messages = this.doc.getArray<ChannelMessageData>('messages');
    return messages.toArray().filter(m => m.channelId === channelId);
  }

  addMessage(message: ChannelMessageData): void {
    const messages = this.doc.getArray<ChannelMessageData>('messages');
    messages.push([message]);
    log.info({ messageId: message.id, channelId: message.channelId }, 'Message added');
  }

  deleteMessage(messageId: string): void {
    const messages = this.doc.getArray<ChannelMessageData>('messages');
    const index = messages.toArray().findIndex(m => m.id === messageId);
    if (index !== -1) {
      messages.delete(index, 1);
      log.info({ messageId }, 'Message deleted');
    }
  }

  getMemberCount(): number {
    return this.getMembers().length;
  }

  getChannelCount(): number {
    return this.getChannels().length;
  }

  getSettings(): TeamSettings {
    const settings = this.doc.getMap<unknown>('settings');
    return {
      visibility: (settings.get('visibility') as TeamSettings['visibility']) || 'invite',
      type: (settings.get('type') as TeamSettings['type']) || 'project',
      allowGuestAccess: (settings.get('allowGuestAccess') as boolean) ?? false,
      requireApproval: (settings.get('requireApproval') as boolean) ?? true,
      maxMembers: settings.get('maxMembers') as number | undefined,
    };
  }

  updateSettings(updates: Partial<TeamSettings>): void {
    const settings = this.doc.getMap<unknown>('settings');
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        settings.set(key, value);
      }
    }
  }
}
