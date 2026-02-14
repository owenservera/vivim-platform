// Social Network Types - Friends, Groups, Follows, Teams
// These extend the existing Circle types with richer social features

// Friends (Bidirectional - like Facebook)
export type FriendStatus = 'pending' | 'accepted' | 'rejected' | 'blocked' | 'cancelled';

export interface Friend {
  id: string;
  requesterId: string;
  requesterDid: string;
  requesterDisplayName?: string;
  requesterAvatarUrl?: string;
  addresseeId: string;
  addresseeDid: string;
  addresseeDisplayName?: string;
  addresseeAvatarUrl?: string;
  status: FriendStatus;
  message?: string;
  requestedAt: string;
  respondedAt?: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromDid: string;
  fromDisplayName: string;
  fromAvatarUrl?: string;
  toUserId: string;
  toDid: string;
  toDisplayName: string;
  toAvatarUrl?: string;
  message?: string;
  createdAt: string;
}

export interface FriendSettings {
  notifyOnAccept: boolean;
  shareActivity: boolean;
  showInProfile: boolean;
  autoAcceptFriends?: boolean;
}

// Follows (Unidirectional - like Twitter/X)
export type FollowStatus = 'pending' | 'active' | 'blocked';

export interface Follow {
  id: string;
  followerId: string;
  followerDid: string;
  followerDisplayName?: string;
  followerAvatarUrl?: string;
  followingId: string;
  followingDid: string;
  followingDisplayName?: string;
  followingAvatarUrl?: string;
  status: FollowStatus;
  notifyOnPost: boolean;
  showInFeed: boolean;
  createdAt: string;
}

export interface FollowerStats {
  followerCount: number;
  followingCount: number;
}

// Groups (Flexible organization - different from Circles)
export type GroupType = 'general' | 'study' | 'project' | 'community';
export type GroupVisibility = 'public' | 'approval' | 'private';
export type GroupMemberRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface Group {
  id: string;
  ownerId: string;
  ownerDid: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  type: GroupType;
  visibility: GroupVisibility;
  allowMemberInvite: boolean;
  allowMemberPost: boolean;
  maxMembers?: number;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  userDid: string;
  displayName: string;
  avatarUrl?: string;
  role: GroupMemberRole;
  notifyOnPost: boolean;
  showInFeed: boolean;
  postCount: number;
  joinedAt: string;
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  authorDid: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  content: string;
  contentType: 'text' | 'image' | 'link' | 'acu';
  acuId?: string;
  attachments: Attachment[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  invitedBy: string;
  inviteeEmail?: string;
  inviteeDid?: string;
  inviteCode: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

// Teams (Collaborative work - like Slack)
export type TeamType = 'work' | 'project' | 'personal';
export type TeamVisibility = 'open' | 'invite';
export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'guest';
export type ChannelType = 'public' | 'private' | 'direct';

export interface Team {
  id: string;
  ownerId: string;
  ownerDid: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  type: TeamType;
  visibility: TeamVisibility;
  allowGuestAccess: boolean;
  requireApproval: boolean;
  maxMembers?: number;
  memberCount: number;
  channelCount: number;
  isPersonal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  userDid: string;
  displayName: string;
  avatarUrl?: string;
  role: TeamMemberRole;
  title?: string;
  notifyAll: boolean;
  notifyMentions: boolean;
  messageCount: number;
  lastActiveAt?: string;
  joinedAt: string;
}

export interface TeamChannel {
  id: string;
  teamId: string;
  name: string;
  description?: string;
  type: ChannelType;
  sortOrder: number;
  memberCount: number;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  userDid: string;
  notify: boolean;
  mute: boolean;
  lastReadAt?: string;
  joinedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorDid: string;
  authorDisplayName: string;
  authorAvatarUrl?: string;
  content: string;
  contentType: 'text' | 'image' | 'link' | 'file';
  parentId?: string;
  editedAt?: string;
  reactions: Reaction[];
  createdAt: string;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
  count: number;
}

// Shared Types
export interface Attachment {
  id: string;
  type: 'image' | 'link' | 'file' | 'acu';
  url?: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
}

export interface UserProfile {
  id: string;
  did: string;
  handle?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  isFollowedByViewer?: boolean;
  isFollowedByMe?: boolean;
  isFriendWithViewer?: boolean;
}

// API Request/Response Types
export interface CreateFriendRequest {
  addresseeId: string;
  message?: string;
}

export interface UpdateFriendStatusRequest {
  status: 'accepted' | 'rejected' | 'blocked';
}

export interface CreateFollowRequest {
  followingId: string;
  notifyOnPost?: boolean;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  type: GroupType;
  visibility: GroupVisibility;
  allowMemberInvite?: boolean;
  allowMemberPost?: boolean;
  maxMembers?: number;
}

export interface CreateGroupPostRequest {
  groupId: string;
  content: string;
  contentType?: 'text' | 'image' | 'link' | 'acu';
  acuId?: string;
  attachments?: Attachment[];
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  avatarUrl?: string;
  type: TeamType;
  visibility: TeamVisibility;
  allowGuestAccess?: boolean;
  requireApproval?: boolean;
  maxMembers?: number;
}

export interface CreateTeamChannelRequest {
  teamId: string;
  name: string;
  description?: string;
  type: ChannelType;
}

export interface SendChannelMessageRequest {
  channelId: string;
  content: string;
  contentType?: 'text' | 'image' | 'link' | 'file';
  parentId?: string;
}

// Relationship Summary
export interface SocialSummary {
  friendCount: number;
  followerCount: number;
  followingCount: number;
  groupCount: number;
  teamCount: number;
}

export interface RelationshipWithUser {
  isFriend: boolean;
  friendStatus?: FriendStatus;
  amIFollowing: boolean;
  isFollowingMe: boolean;
  sharedGroups: string[];
  sharedTeams: string[];
}
