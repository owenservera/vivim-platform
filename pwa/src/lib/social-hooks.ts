import { useState, useEffect, useCallback } from 'react';
import { logger } from './logger';
import type {
  Friend,
  Follow,
  Group,
  GroupMember,
  GroupPost,
  Team,
  TeamMember,
  TeamChannel,
  ChannelMessage,
  SocialSummary,
  CreateFriendRequest,
  CreateFollowRequest,
  CreateGroupRequest,
  CreateGroupPostRequest,
  CreateTeamRequest,
  CreateTeamChannelRequest,
  SendChannelMessageRequest,
} from '../types/social';

const API_BASE = '/api/v3/social';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const socialService = {
  // Summary
  async getSummary(): Promise<SocialSummary> {
    const result = await fetchApi<{ success: boolean } & SocialSummary>('/summary');
    return result as SocialSummary;
  },

  async getRelationship(otherUserId: string): Promise<{
    isFriend: boolean;
    friendStatus?: string;
    amIFollowing: boolean;
    isFollowingMe: boolean;
  }> {
    const result = await fetchApi<{ success: boolean; isFriend: boolean; amIFollowing: boolean; isFollowingMe: boolean }>(`/relationship/${otherUserId}`);
    return result;
  },

  // Friends
  async getFriends(): Promise<Friend[]> {
    const result = await fetchApi<{ success: boolean; friends: Friend[] }>('/friends');
    return result.friends;
  },

  async getFriendRequests(): Promise<Friend[]> {
    const result = await fetchApi<{ success: boolean; requests: Friend[] }>('/friends/requests');
    return result.requests;
  },

  async sendFriendRequest(data: CreateFriendRequest): Promise<Friend> {
    const result = await fetchApi<{ success: boolean; friend: Friend }>('/friends', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.friend;
  },

  async respondToFriendRequest(friendId: string, response: 'ACCEPTED' | 'REJECTED'): Promise<Friend> {
    const result = await fetchApi<{ success: boolean; friend: Friend }>(`/friends/${friendId}/respond`, {
      method: 'PUT',
      body: JSON.stringify({ response }),
    });
    return result.friend;
  },

  async removeFriend(friendId: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/friends/${friendId}`, { method: 'DELETE' });
  },

  async blockFriend(friendId: string): Promise<Friend> {
    const result = await fetchApi<{ success: boolean; friend: Friend }>(`/friends/${friendId}/block`, {
      method: 'PUT',
    });
    return result.friend;
  },

  // Follows
  async getFollowers(): Promise<Follow[]> {
    const result = await fetchApi<{ success: boolean; followers: Follow[] }>('/followers');
    return result.followers;
  },

  async getFollowing(): Promise<Follow[]> {
    const result = await fetchApi<{ success: boolean; following: Follow[] }>('/following');
    return result.following;
  },

  async followUser(data: CreateFollowRequest): Promise<Follow> {
    const result = await fetchApi<{ success: boolean; follow: Follow }>('/follow', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.follow;
  },

  async unfollowUser(followingId: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/follow/${followingId}`, { method: 'DELETE' });
  },

  async updateFollowSettings(followId: string, notifyOnPost: boolean, showInFeed: boolean): Promise<Follow> {
    const result = await fetchApi<{ success: boolean; follow: Follow }>(`/follow/${followId}/settings`, {
      method: 'PUT',
      body: JSON.stringify({ notifyOnPost, showInFeed }),
    });
    return result.follow;
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    const result = await fetchApi<{ success: boolean; groups: Group[] }>('/groups');
    return result.groups;
  },

  async getPublicGroups(limit = 50, offset = 0): Promise<Group[]> {
    const result = await fetchApi<{ success: boolean; groups: Group[] }>(`/groups/public?limit=${limit}&offset=${offset}`);
    return result.groups;
  },

  async createGroup(data: CreateGroupRequest): Promise<Group> {
    const result = await fetchApi<{ success: boolean; group: Group }>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.group;
  },

  async getGroup(groupId: string): Promise<Group> {
    const result = await fetchApi<{ success: boolean; group: Group }>(`/groups/${groupId}`);
    return result.group;
  },

  async updateGroup(groupId: string, data: Partial<Group>): Promise<Group> {
    const result = await fetchApi<{ success: boolean; group: Group }>(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.group;
  },

  async deleteGroup(groupId: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/groups/${groupId}`, { method: 'DELETE' });
  },

  async joinGroup(groupId: string): Promise<GroupMember> {
    const result = await fetchApi<{ success: boolean; member: GroupMember }>(`/groups/${groupId}/join`, {
      method: 'POST',
    });
    return result.member;
  },

  async leaveGroup(groupId: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/groups/${groupId}/leave`, { method: 'POST' });
  },

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const result = await fetchApi<{ success: boolean; members: GroupMember[] }>(`/groups/${groupId}/members`);
    return result.members;
  },

  async updateMemberRole(groupId: string, memberId: string, role: string): Promise<GroupMember> {
    const result = await fetchApi<{ success: boolean; member: GroupMember }>(`/groups/${groupId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    return result.member;
  },

  async getGroupPosts(groupId: string, limit = 20, offset = 0): Promise<GroupPost[]> {
    const result = await fetchApi<{ success: boolean; posts: GroupPost[] }>(`/groups/${groupId}/posts?limit=${limit}&offset=${offset}`);
    return result.posts;
  },

  async createGroupPost(groupId: string, data: CreateGroupPostRequest): Promise<GroupPost> {
    const result = await fetchApi<{ success: boolean; post: GroupPost }>(`/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.post;
  },

  // Teams
  async getTeams(): Promise<Team[]> {
    const result = await fetchApi<{ success: boolean; teams: Team[] }>('/teams');
    return result.teams;
  },

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const result = await fetchApi<{ success: boolean; team: Team }>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.team;
  },

  async getTeam(teamId: string): Promise<Team> {
    const result = await fetchApi<{ success: boolean; team: Team }>(`/teams/${teamId}`);
    return result.team;
  },

  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    const result = await fetchApi<{ success: boolean; team: Team }>(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result.team;
  },

  async deleteTeam(teamId: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/teams/${teamId}`, { method: 'DELETE' });
  },

  async addTeamMember(teamId: string, data: { userId?: string; role?: string; title?: string }): Promise<TeamMember> {
    const result = await fetchApi<{ success: boolean; member: TeamMember }>(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.member;
  },

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    await fetchApi<{ success: boolean }>(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
  },

  async createChannel(teamId: string, data: CreateTeamChannelRequest): Promise<TeamChannel> {
    const result = await fetchApi<{ success: boolean; channel: TeamChannel }>(`/teams/${teamId}/channels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.channel;
  },

  async getChannelMessages(channelId: string, limit = 50, offset = 0): Promise<ChannelMessage[]> {
    const result = await fetchApi<{ success: boolean; messages: ChannelMessage[] }>(`/teams/${'TODO'}/channels/${channelId}/messages?limit=${limit}&offset=${offset}`);
    return result.messages;
  },

  async sendMessage(channelId: string, data: SendChannelMessageRequest): Promise<ChannelMessage> {
    const result = await fetchApi<{ success: boolean; message: ChannelMessage }>(`/teams/TODO/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result.message;
  },
};

export function useSocialSummary() {
  const [summary, setSummary] = useState<SocialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getSummary();
      setSummary(data);
    } catch (err) {
      setError('Failed to load social summary');
      logger.error('useSocialSummary error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  return { summary, loading, error, refresh: loadSummary };
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [friendsData, requestsData] = await Promise.all([
        socialService.getFriends(),
        socialService.getFriendRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (err) {
      setError('Failed to load friends');
      logger.error('useFriends error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const sendRequest = useCallback(async (addresseeId: string, message?: string) => {
    const friend = await socialService.sendFriendRequest({ addresseeId, message });
    setRequests(prev => [...prev, friend]);
    return friend;
  }, []);

  const respondToRequest = useCallback(async (friendId: string, response: 'ACCEPTED' | 'REJECTED') => {
    const friend = await socialService.respondToFriendRequest(friendId, response);
    if (response === 'ACCEPTED') {
      setFriends(prev => [...prev, friend]);
      setRequests(prev => prev.filter(r => r.id !== friendId));
    } else {
      setRequests(prev => prev.filter(r => r.id !== friendId));
    }
    return friend;
  }, []);

  const removeFriend = useCallback(async (friendId: string) => {
    await socialService.removeFriend(friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
  }, []);

  const blockFriend = useCallback(async (friendId: string) => {
    await socialService.blockFriend(friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
    setRequests(prev => prev.filter(r => r.id !== friendId));
  }, []);

  return {
    friends,
    requests,
    loading,
    error,
    refresh: loadFriends,
    sendRequest,
    respondToRequest,
    removeFriend,
    blockFriend,
  };
}

export function useFollows() {
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [followersData, followingData] = await Promise.all([
        socialService.getFollowers(),
        socialService.getFollowing(),
      ]);
      setFollowers(followersData);
      setFollowing(followingData);
    } catch (err) {
      setError('Failed to load follows');
      logger.error('useFollows error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFollows();
  }, [loadFollows]);

  const follow = useCallback(async (followingId: string, notifyOnPost = false) => {
    const follow = await socialService.followUser({ followingId, notifyOnPost });
    setFollowing(prev => [...prev, follow]);
    return follow;
  }, []);

  const unfollow = useCallback(async (followingId: string) => {
    await socialService.unfollowUser(followingId);
    setFollowing(prev => prev.filter(f => f.followingId !== followingId));
  }, []);

  const updateSettings = useCallback(async (followId: string, notifyOnPost: boolean, showInFeed: boolean) => {
    const follow = await socialService.updateFollowSettings(followId, notifyOnPost, showInFeed);
    setFollowing(prev => prev.map(f => f.id === followId ? follow : f));
    return follow;
  }, []);

  return {
    followers,
    following,
    loading,
    error,
    refresh: loadFollows,
    follow,
    unfollow,
    updateSettings,
  };
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [myGroups, publicData] = await Promise.all([
        socialService.getGroups(),
        socialService.getPublicGroups(),
      ]);
      setGroups(myGroups);
      setPublicGroups(publicData);
    } catch (err) {
      setError('Failed to load groups');
      logger.error('useGroups error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const createGroup = useCallback(async (data: CreateGroupRequest) => {
    const group = await socialService.createGroup(data);
    setGroups(prev => [...prev, group]);
    return group;
  }, []);

  const joinGroup = useCallback(async (groupId: string) => {
    const member = await socialService.joinGroup(groupId);
    await loadGroups();
    return member;
  }, [loadGroups]);

  const leaveGroup = useCallback(async (groupId: string) => {
    await socialService.leaveGroup(groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    await socialService.deleteGroup(groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  const createPost = useCallback(async (groupId: string, data: CreateGroupPostRequest) => {
    const post = await socialService.createGroupPost(groupId, data);
    return post;
  }, []);

  return {
    groups,
    publicGroups,
    loading,
    error,
    refresh: loadGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    deleteGroup,
    createPost,
  };
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [groupData, membersData, postsData] = await Promise.all([
        socialService.getGroup(groupId),
        socialService.getGroupMembers(groupId),
        socialService.getGroupPosts(groupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      setPosts(postsData);
    } catch (err) {
      setError('Failed to load group');
      logger.error('useGroup error', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const updateGroup = useCallback(async (data: Partial<Group>) => {
    const updated = await socialService.updateGroup(groupId, data);
    setGroup(updated);
    return updated;
  }, [groupId]);

  const createPost = useCallback(async (data: CreateGroupPostRequest) => {
    const post = await socialService.createGroupPost(groupId, data);
    setPosts(prev => [post, ...prev]);
    return post;
  }, [groupId]);

  const updateMemberRole = useCallback(async (memberId: string, role: string) => {
    const member = await socialService.updateMemberRole(groupId, memberId, role);
    setMembers(prev => prev.map(m => m.id === memberId ? member : m));
    return member;
  }, [groupId]);

  return {
    group,
    members,
    posts,
    loading,
    error,
    refresh: loadGroup,
    updateGroup,
    createPost,
    updateMemberRole,
  };
}

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getTeams();
      setTeams(data);
    } catch (err) {
      setError('Failed to load teams');
      logger.error('useTeams error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const createTeam = useCallback(async (data: CreateTeamRequest) => {
    const team = await socialService.createTeam(data);
    setTeams(prev => [...prev, team]);
    return team;
  }, []);

  const deleteTeam = useCallback(async (teamId: string) => {
    await socialService.deleteTeam(teamId);
    setTeams(prev => prev.filter(t => t.id !== teamId));
  }, []);

  const createChannel = useCallback(async (teamId: string, data: CreateTeamChannelRequest) => {
    const channel = await socialService.createChannel(teamId, data);
    return channel;
  }, []);

  return {
    teams,
    loading,
    error,
    refresh: loadTeams,
    createTeam,
    deleteTeam,
    createChannel,
  };
}

export function useTeam(teamId: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getTeam(teamId);
      setTeam(data);
    } catch (err) {
      setError('Failed to load team');
      logger.error('useTeam error', err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const updateTeam = useCallback(async (data: Partial<Team>) => {
    const updated = await socialService.updateTeam(teamId, data);
    setTeam(updated);
    return updated;
  }, [teamId]);

  const addMember = useCallback(async (data: { userId?: string; role?: string; title?: string }) => {
    const member = await socialService.addTeamMember(teamId, data);
    await loadTeam();
    return member;
  }, [teamId, loadTeam]);

  const removeMember = useCallback(async (memberId: string) => {
    await socialService.removeTeamMember(teamId, memberId);
    await loadTeam();
  }, [teamId, loadTeam]);

  return {
    team,
    loading,
    error,
    refresh: loadTeam,
    updateTeam,
    addMember,
    removeMember,
  };
}

export function useChannelMessages(channelId: string) {
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await socialService.getChannelMessages(channelId);
      setMessages(data.reverse());
    } catch (err) {
      setError('Failed to load messages');
      logger.error('useChannelMessages error', err);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendMessage = useCallback(async (content: string, contentType?: string, parentId?: string) => {
    const message = await socialService.sendMessage(channelId, { content, contentType, parentId });
    setMessages(prev => [...prev, message]);
    return message;
  }, [channelId]);

  return {
    messages,
    loading,
    error,
    refresh: loadMessages,
    sendMessage,
  };
}
