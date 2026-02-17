import {
  PrismaClient,
  Friend,
  Follow,
  Group,
  GroupMember,
  GroupPost,
  Team,
  TeamMember,
  TeamChannel,
  ChannelMember,
  ChannelMessage,
} from '@prisma/client';
import { debugReporter } from './debug-reporter.js';

export class SocialService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ============================================================================
  // FRIENDS
  // ============================================================================

  async getFriends(userId: string): Promise<Friend[]> {
    return this.prisma.friend.findMany({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { addresseeId: userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        requester: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
        addressee: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getPendingFriendRequests(userId: string): Promise<Friend[]> {
    return this.prisma.friend.findMany({
      where: {
        addresseeId: userId,
        status: 'PENDING',
      },
      include: {
        requester: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async sendFriendRequest(
    requesterId: string,
    addresseeId: string,
    message?: string
  ): Promise<Friend> {
    const startTime = Date.now();
    try {
      const existing = await this.prisma.friend.findFirst({
        where: {
          OR: [
            { requesterId, addresseeId },
            { requesterId: addresseeId, addresseeId: requesterId },
          ],
        },
      });

      if (existing) {
        throw new Error('Friend relationship already exists');
      }

      const friend = await this.prisma.friend.create({
        data: {
          requesterId,
          addresseeId,
          message,
          status: 'PENDING',
        },
        include: {
          requester: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          addressee: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
        },
      });

      debugReporter.trackInfo(
        { category: 'social', message: 'Friend request sent' },
        { requesterId, addresseeId, duration: Date.now() - startTime }
      );

      return friend;
    } catch (error) {
      debugReporter.trackError(error, { operation: 'sendFriendRequest', requesterId, addresseeId });
      throw error;
    }
  }

  async respondToFriendRequest(
    userId: string,
    friendId: string,
    response: 'ACCEPTED' | 'REJECTED'
  ): Promise<Friend> {
    const friend = await this.prisma.friend.findUnique({
      where: { id: friendId },
    });

    if (!friend || friend.addresseeId !== userId) {
      throw new Error('Friend request not found');
    }

    return this.prisma.friend.update({
      where: { id: friendId },
      data: {
        status: response,
        respondedAt: new Date(),
      },
      include: {
        requester: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
        addressee: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friend = await this.prisma.friend.findUnique({
      where: { id: friendId },
    });

    if (!friend || (friend.requesterId !== userId && friend.addresseeId !== userId)) {
      throw new Error('Friend relationship not found');
    }

    await this.prisma.friend.delete({ where: { id: friendId } });
  }

  async blockFriend(userId: string, friendId: string): Promise<Friend> {
    const friend = await this.prisma.friend.findUnique({
      where: { id: friendId },
    });

    if (!friend || (friend.requesterId !== userId && friend.addresseeId !== userId)) {
      throw new Error('Friend relationship not found');
    }

    return this.prisma.friend.update({
      where: { id: friendId },
      data: { status: 'BLOCKED' },
    });
  }

  async getFriendCount(userId: string): Promise<number> {
    return this.prisma.friend.count({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { addresseeId: userId, status: 'ACCEPTED' },
        ],
      },
    });
  }

  // ============================================================================
  // FOLLOWS
  // ============================================================================

  async getFollowers(userId: string): Promise<Follow[]> {
    return this.prisma.follow.findMany({
      where: {
        followingId: userId,
        status: 'ACTIVE',
      },
      include: {
        follower: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    return this.prisma.follow.findMany({
      where: {
        followerId: userId,
        status: 'ACTIVE',
      },
      include: {
        following: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async followUser(followerId: string, followingId: string, notifyOnPost = false): Promise<Follow> {
    const existing = await this.prisma.follow.findFirst({
      where: { followerId, followingId },
    });

    if (existing) {
      throw new Error('Already following this user');
    }

    return this.prisma.follow.create({
      data: {
        followerId,
        followingId,
        notifyOnPost,
        showInFeed: true,
        status: 'ACTIVE',
      },
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const follow = await this.prisma.follow.findFirst({
      where: { followerId, followingId },
    });

    if (!follow) {
      throw new Error('Not following this user');
    }

    await this.prisma.follow.delete({ where: { id: follow.id } });
  }

  async updateFollowSettings(
    followId: string,
    userId: string,
    notifyOnPost: boolean,
    showInFeed: boolean
  ): Promise<Follow> {
    const follow = await this.prisma.follow.findUnique({
      where: { id: followId },
    });

    if (!follow || follow.followerId !== userId) {
      throw new Error('Follow not found');
    }

    return this.prisma.follow.update({
      where: { id: followId },
      data: { notifyOnPost, showInFeed },
    });
  }

  async getFollowerCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followingId: userId, status: 'ACTIVE' },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followerId: userId, status: 'ACTIVE' },
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({
      where: { followerId, followingId, status: 'ACTIVE' },
    });
    return !!follow;
  }

  // ============================================================================
  // GROUPS
  // ============================================================================

  async getGroups(userId: string): Promise<Group[]> {
    const memberships = await this.prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });

    const groupIds = memberships.map((m) => m.groupId);

    return this.prisma.group.findMany({
      where: { id: { in: groupIds } },
      include: {
        members: {
          include: {
            user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPublicGroups(limit = 50, offset = 0): Promise<Group[]> {
    return this.prisma.group.findMany({
      where: { visibility: 'PUBLIC' },
      include: {
        owner: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
      take: limit,
      skip: offset,
      orderBy: { memberCount: 'desc' },
    });
  }

  async createGroup(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      avatarUrl?: string;
      type: 'GENERAL' | 'STUDY' | 'PROJECT' | 'COMMUNITY';
      visibility: 'PUBLIC' | 'APPROVAL' | 'PRIVATE';
      allowMemberInvite?: boolean;
      allowMemberPost?: boolean;
      maxMembers?: number;
    }
  ): Promise<Group> {
    return this.prisma.group.create({
      data: {
        ownerId,
        name: data.name,
        description: data.description,
        avatarUrl: data.avatarUrl,
        type: data.type,
        visibility: data.visibility,
        allowMemberInvite: data.allowMemberInvite ?? true,
        allowMemberPost: data.allowMemberPost ?? true,
        maxMembers: data.maxMembers,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getGroup(groupId: string): Promise<Group | null> {
    return this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          },
        },
        posts: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  async updateGroup(groupId: string, userId: string, data: Partial<Group>): Promise<Group> {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!member) {
      throw new Error('Not authorized to update group');
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data,
      include: {
        members: {
          include: {
            user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async deleteGroup(groupId: string, userId: string): Promise<void> {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId, role: 'OWNER' },
    });

    if (!member) {
      throw new Error('Only owner can delete group');
    }

    await this.prisma.group.delete({ where: { id: groupId } });
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMember> {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });

    if (!group) {
      throw new Error('Group not found');
    }

    const existingMember = await this.prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (existingMember) {
      throw new Error('Already a member');
    }

    if (group.visibility === 'PRIVATE') {
      throw new Error('Cannot join private group');
    }

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId },
    });

    if (!member) {
      throw new Error('Not a member of this group');
    }

    await this.prisma.groupMember.delete({ where: { id: member.id } });
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(
    groupId: string,
    memberId: string,
    updaterId: string,
    newRole: 'ADMIN' | 'MODERATOR' | 'MEMBER'
  ): Promise<GroupMember> {
    const updater = await this.prisma.groupMember.findFirst({
      where: { groupId, userId: updaterId, role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!updater) {
      throw new Error('Not authorized');
    }

    return this.prisma.groupMember.update({
      where: { id: memberId },
      data: { role: newRole },
      include: {
        user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  async createGroupPost(
    groupId: string,
    authorId: string,
    data: {
      content: string;
      contentType?: string;
      acuId?: string;
      attachments?: any;
    }
  ): Promise<GroupPost> {
    const member = await this.prisma.groupMember.findFirst({
      where: { groupId, userId: authorId },
    });

    if (!member) {
      throw new Error('Must be a member to post');
    }

    const post = await this.prisma.groupPost.create({
      data: {
        groupId,
        authorId,
        content: data.content,
        contentType: data.contentType || 'text',
        acuId: data.acuId,
        attachments: data.attachments || [],
      },
      include: {
        author: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
    });

    await this.prisma.group.update({
      where: { id: groupId },
      data: { postCount: { increment: 1 } },
    });

    return post;
  }

  async getGroupPosts(groupId: string, limit = 20, offset = 0): Promise<GroupPost[]> {
    return this.prisma.groupPost.findMany({
      where: { groupId },
      include: {
        author: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // ============================================================================
  // TEAMS
  // ============================================================================

  async getTeams(userId: string): Promise<Team[]> {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true },
    });

    const teamIds = memberships.map((m) => m.teamId);

    return this.prisma.team.findMany({
      where: { id: { in: teamIds } },
      include: {
        members: {
          include: {
            user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createTeam(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      avatarUrl?: string;
      type: 'WORK' | 'PROJECT' | 'PERSONAL';
      visibility?: 'OPEN' | 'INVITE';
      allowGuestAccess?: boolean;
      requireApproval?: boolean;
      maxMembers?: number;
      isPersonal?: boolean;
    }
  ): Promise<Team> {
    return this.prisma.team.create({
      data: {
        ownerId,
        name: data.name,
        description: data.description,
        avatarUrl: data.avatarUrl,
        type: data.type,
        visibility: data.visibility || 'INVITE',
        allowGuestAccess: data.allowGuestAccess ?? false,
        requireApproval: data.requireApproval ?? true,
        maxMembers: data.maxMembers,
        isPersonal: data.isPersonal ?? false,
        members: {
          create: {
            userId: ownerId,
            role: 'OWNER',
          },
        },
        channels: {
          create: {
            name: 'general',
            description: 'General discussion',
            type: 'PUBLIC',
            sortOrder: 0,
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          },
        },
        channels: true,
      },
    });
  }

  async getTeam(teamId: string): Promise<Team | null> {
    return this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
          },
        },
        channels: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async updateTeam(teamId: string, userId: string, data: Partial<Team>): Promise<Team> {
    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!member) {
      throw new Error('Not authorized to update team');
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data,
    });
  }

  async deleteTeam(teamId: string, userId: string): Promise<void> {
    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, role: 'OWNER' },
    });

    if (!member) {
      throw new Error('Only owner can delete team');
    }

    await this.prisma.team.delete({ where: { id: teamId } });
  }

  async addTeamMember(
    teamId: string,
    userId: string,
    data: {
      role?: 'ADMIN' | 'MEMBER' | 'GUEST';
      title?: string;
    }
  ): Promise<TeamMember> {
    const existing = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
    });

    if (existing) {
      throw new Error('Already a member');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId,
        role: data.role || 'MEMBER',
        title: data.title,
      },
      include: {
        user: { select: { id: true, did: true, displayName: true, avatarUrl: true } },
      },
    });

    await this.prisma.team.update({
      where: { id: teamId },
      data: { memberCount: { increment: 1 } },
    });

    return member;
  }

  async removeTeamMember(teamId: string, memberId: string, requesterId: string): Promise<void> {
    const requester = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: requesterId, role: { in: ['OWNER', 'ADMIN'] } },
    });

    if (!requester) {
      throw new Error('Not authorized');
    }

    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.teamId !== teamId) {
      throw new Error('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new Error('Cannot remove owner');
    }

    await this.prisma.teamMember.delete({ where: { id: memberId } });

    await this.prisma.team.update({
      where: { id: teamId },
      data: { memberCount: { decrement: 1 } },
    });
  }

  async createChannel(
    teamId: string,
    creatorId: string,
    data: {
      name: string;
      description?: string;
      type?: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
    }
  ): Promise<TeamChannel> {
    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId: creatorId },
    });

    if (!member) {
      throw new Error('Must be a team member');
    }

    const maxOrder = await this.prisma.teamChannel.findFirst({
      where: { teamId },
      orderBy: { sortOrder: 'desc' },
    });

    const channel = await this.prisma.teamChannel.create({
      data: {
        teamId,
        name: data.name,
        description: data.description,
        type: data.type || 'PUBLIC',
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });

    await this.prisma.team.update({
      where: { id: teamId },
      data: { channelCount: { increment: 1 } },
    });

    return channel;
  }

  async getChannelMessages(channelId: string, limit = 50, offset = 0): Promise<ChannelMessage[]> {
    return this.prisma.channelMessage.findMany({
      where: { channelId },
      include: {
        channel: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async sendChannelMessage(
    channelId: string,
    authorId: string,
    data: {
      content: string;
      contentType?: string;
      parentId?: string;
    }
  ): Promise<ChannelMessage> {
    const member = await this.prisma.channelMember.findFirst({
      where: { channelId, userId: authorId },
    });

    if (!member) {
      const channel = await this.prisma.teamChannel.findUnique({
        where: { id: channelId },
        include: { team: true },
      });

      if (channel?.type === 'PUBLIC') {
        await this.prisma.channelMember.create({
          data: { channelId, userId: authorId, notify: true },
        });
      } else {
        throw new Error('Not authorized to post in this channel');
      }
    }

    const message = await this.prisma.channelMessage.create({
      data: {
        channelId,
        authorId,
        content: data.content,
        contentType: data.contentType || 'text',
        parentId: data.parentId,
      },
    });

    await this.prisma.teamChannel.update({
      where: { id: channelId },
      data: { messageCount: { increment: 1 } },
    });

    return message;
  }

  // ============================================================================
  // SOCIAL SUMMARY
  // ============================================================================

  async getSocialSummary(userId: string): Promise<{
    friendCount: number;
    followerCount: number;
    followingCount: number;
    groupCount: number;
    teamCount: number;
  }> {
    const [friendCount, followerCount, followingCount, groupCount, teamCount] = await Promise.all([
      this.getFriendCount(userId),
      this.getFollowerCount(userId),
      this.getFollowingCount(userId),
      this.prisma.groupMember.count({ where: { userId } }),
      this.prisma.teamMember.count({ where: { userId } }),
    ]);

    return { friendCount, followerCount, followingCount, groupCount, teamCount };
  }

  async getRelationshipWithUser(
    userId: string,
    otherUserId: string
  ): Promise<{
    isFriend: boolean;
    friendStatus?: string;
    amIFollowing: boolean;
    isFollowingMe: boolean;
  }> {
    const [friend, amIFollowing, isFollowingMe] = await Promise.all([
      this.prisma.friend.findFirst({
        where: {
          OR: [
            { requesterId: userId, addresseeId: otherUserId },
            { requesterId: otherUserId, addresseeId: userId },
          ],
          status: 'ACCEPTED',
        },
      }),
      this.isFollowing(userId, otherUserId),
      this.isFollowing(otherUserId, userId),
    ]);

    return {
      isFriend: !!friend,
      amIFollowing,
      isFollowingMe,
    };
  }
}
