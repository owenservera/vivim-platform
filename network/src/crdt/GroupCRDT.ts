import * as Y from 'yjs';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('crdt:group');

export interface GroupMemberData {
  id: string;
  userDid: string;
  displayName: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  notifyOnPost: boolean;
  showInFeed: boolean;
  postCount: number;
  joinedAt: number;
  metadata: Record<string, unknown>;
}

export interface GroupPostData {
  id: string;
  groupId: string;
  authorDid: string;
  content: string;
  contentType: string;
  acuId?: string;
  attachments: Record<string, unknown>[];
  likeCount: number;
  commentCount: number;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export interface GroupSettings {
  visibility: 'public' | 'approval' | 'private';
  type: 'general' | 'study' | 'project' | 'community';
  allowMemberInvite: boolean;
  allowMemberPost: boolean;
  maxMembers?: number;
}

export class GroupCRDT {
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
    const map = this.doc.getMap('groupData');
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
    const map = this.doc.getMap('groupData');
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

  getMembers(): GroupMemberData[] {
    const members = this.doc.getMap<GroupMemberData>('members');
    const result: GroupMemberData[] = [];
    members.forEach((value) => result.push(value));
    return result;
  }

  addMember(member: GroupMemberData): void {
    const members = this.doc.getMap<GroupMemberData>('members');
    members.set(member.id, member);
    log.info({ memberId: member.id, role: member.role }, 'Member added to group');
  }

  removeMember(memberId: string): void {
    const members = this.doc.getMap<GroupMemberData>('members');
    members.delete(memberId);
    log.info({ memberId }, 'Member removed from group');
  }

  updateMemberRole(memberId: string, role: GroupMemberData['role']): void {
    const members = this.doc.getMap<GroupMemberData>('members');
    const member = members.get(memberId);
    if (member) {
      members.set(memberId, { ...member, role });
    }
  }

  getMember(did: string): GroupMemberData | undefined {
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

  getPosts(): GroupPostData[] {
    const posts = this.doc.getArray<GroupPostData>('posts');
    return posts.toArray();
  }

  addPost(post: GroupPostData): void {
    const posts = this.doc.getArray<GroupPostData>('posts');
    posts.push([post]);
    log.info({ postId: post.id }, 'Post added to group');
  }

  removePost(postId: string): void {
    const posts = this.doc.getArray<GroupPostData>('posts');
    const index = posts.toArray().findIndex(p => p.id === postId);
    if (index !== -1) {
      posts.delete(index, 1);
      log.info({ postId }, 'Post removed from group');
    }
  }

  getMemberCount(): number {
    return this.getMembers().length;
  }

  getPostCount(): number {
    return this.getPosts().length;
  }

  getSettings(): GroupSettings {
    const settings = this.doc.getMap<unknown>('settings');
    return {
      visibility: (settings.get('visibility') as GroupSettings['visibility']) || 'approval',
      type: (settings.get('type') as GroupSettings['type']) || 'general',
      allowMemberInvite: (settings.get('allowMemberInvite') as boolean) ?? true,
      allowMemberPost: (settings.get('allowMemberPost') as boolean) ?? true,
      maxMembers: settings.get('maxMembers') as number | undefined,
    };
  }

  updateSettings(updates: Partial<GroupSettings>): void {
    const settings = this.doc.getMap<unknown>('settings');
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        settings.set(key, value);
      }
    }
  }
}
