import { Router, Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../lib/database.js';
import { createRequestLogger } from '../lib/logger.js';
import { SocialService } from '../services/social-service.js';

const router = Router();
const log = createRequestLogger('social-routes');

const prisma = getPrismaClient();
const socialService = new SocialService(prisma);

function authenticateDIDMiddleware(req: Request, res: Response, next: NextFunction) {
  const did = req.headers['x-did'] || (req.headers['authorization'] || '').replace('Bearer did:', 'did:');
  
  if (!did) {
    return res.status(401).json({ success: false, error: 'DID required' });
  }

  if (!did.startsWith('did:')) {
    return res.status(401).json({ success: false, error: 'Invalid DID format' });
  }
  
  next();
}

router.use(authenticateDIDMiddleware);

async function getUserIdFromDID(did: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { did },
    select: { id: true },
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user.id;
}

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const summary = await socialService.getSocialSummary(userId);
    res.json({ success: true, ...summary });
  } catch (error) {
    log.error({ error }, 'Failed to get social summary');
    next(error);
  }
});

router.get('/relationship/:otherUserId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const relationship = await socialService.getRelationshipWithUser(userId, req.params.otherUserId);
    res.json({ success: true, ...relationship });
  } catch (error) {
    log.error({ error }, 'Failed to get relationship');
    next(error);
  }
});

// Friends
router.get('/friends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const friends = await socialService.getFriends(userId);
    res.json({ success: true, friends });
  } catch (error) {
    log.error({ error }, 'Failed to get friends');
    next(error);
  }
});

router.get('/friends/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const requests = await socialService.getPendingFriendRequests(userId);
    res.json({ success: true, requests });
  } catch (error) {
    log.error({ error }, 'Failed to get friend requests');
    next(error);
  }
});

router.post('/friends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { addresseeId, message } = req.body;
    
    if (!addresseeId) {
      return res.status(400).json({ success: false, error: 'addresseeId required' });
    }
    
    const friend = await socialService.sendFriendRequest(userId, addresseeId, message);
    res.json({ success: true, friend });
  } catch (error) {
    log.error({ error }, 'Failed to send friend request');
    next(error);
  }
});

router.put('/friends/:friendId/respond', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { response } = req.body;
    
    if (!response || !['ACCEPTED', 'REJECTED'].includes(response)) {
      return res.status(400).json({ success: false, error: 'Invalid response' });
    }
    
    const friend = await socialService.respondToFriendRequest(userId, req.params.friendId, response);
    res.json({ success: true, friend });
  } catch (error) {
    log.error({ error }, 'Failed to respond to friend request');
    next(error);
  }
});

router.delete('/friends/:friendId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    await socialService.removeFriend(userId, req.params.friendId);
    res.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to remove friend');
    next(error);
  }
});

router.put('/friends/:friendId/block', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const friend = await socialService.blockFriend(userId, req.params.friendId);
    res.json({ success: true, friend });
  } catch (error) {
    log.error({ error }, 'Failed to block friend');
    next(error);
  }
});

// Follows
router.get('/followers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const followers = await socialService.getFollowers(userId);
    res.json({ success: true, followers });
  } catch (error) {
    log.error({ error }, 'Failed to get followers');
    next(error);
  }
});

router.get('/following', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const following = await socialService.getFollowing(userId);
    res.json({ success: true, following });
  } catch (error) {
    log.error({ error }, 'Failed to get following');
    next(error);
  }
});

router.post('/follow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { followingId, notifyOnPost } = req.body;
    
    if (!followingId) {
      return res.status(400).json({ success: false, error: 'followingId required' });
    }
    
    const follow = await socialService.followUser(userId, followingId, notifyOnPost);
    res.json({ success: true, follow });
  } catch (error) {
    log.error({ error }, 'Failed to follow user');
    next(error);
  }
});

router.delete('/follow/:followingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    await socialService.unfollowUser(userId, req.params.followingId);
    res.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to unfollow user');
    next(error);
  }
});

router.put('/follow/:followId/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { notifyOnPost, showInFeed } = req.body;
    
    const follow = await socialService.updateFollowSettings(
      req.params.followId,
      userId,
      notifyOnPost,
      showInFeed
    );
    res.json({ success: true, follow });
  } catch (error) {
    log.error({ error }, 'Failed to update follow settings');
    next(error);
  }
});

// Groups
router.get('/groups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const groups = await socialService.getGroups(userId);
    res.json({ success: true, groups });
  } catch (error) {
    log.error({ error }, 'Failed to get groups');
    next(error);
  }
});

router.get('/groups/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const groups = await socialService.getPublicGroups(
      parseInt(limit as string),
      parseInt(offset as string)
    );
    res.json({ success: true, groups });
  } catch (error) {
    log.error({ error }, 'Failed to get public groups');
    next(error);
  }
});

router.post('/groups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { name, description, avatarUrl, type, visibility, allowMemberInvite, allowMemberPost, maxMembers } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'name required' });
    }
    
    const group = await socialService.createGroup(userId, {
      name,
      description,
      avatarUrl,
      type: type || 'GENERAL',
      visibility: visibility || 'APPROVAL',
      allowMemberInvite,
      allowMemberPost,
      maxMembers,
    });
    res.json({ success: true, group });
  } catch (error) {
    log.error({ error }, 'Failed to create group');
    next(error);
  }
});

router.get('/groups/:groupId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await socialService.getGroup(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, group });
  } catch (error) {
    log.error({ error }, 'Failed to get group');
    next(error);
  }
});

router.put('/groups/:groupId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { name, description, avatarUrl, visibility, allowMemberInvite, allowMemberPost, maxMembers } = req.body;
    
    const group = await socialService.updateGroup(req.params.groupId, userId, {
      name,
      description,
      avatarUrl,
      visibility,
      allowMemberInvite,
      allowMemberPost,
      maxMembers,
    });
    res.json({ success: true, group });
  } catch (error) {
    log.error({ error }, 'Failed to update group');
    next(error);
  }
});

router.delete('/groups/:groupId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    await socialService.deleteGroup(req.params.groupId, userId);
    res.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to delete group');
    next(error);
  }
});

router.post('/groups/:groupId/join', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const member = await socialService.joinGroup(req.params.groupId, userId);
    res.json({ success: true, member });
  } catch (error) {
    log.error({ error }, 'Failed to join group');
    next(error);
  }
});

router.post('/groups/:groupId/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    await socialService.leaveGroup(req.params.groupId, userId);
    res.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to leave group');
    next(error);
  }
});

router.get('/groups/:groupId/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await socialService.getGroupMembers(req.params.groupId);
    res.json({ success: true, members });
  } catch (error) {
    log.error({ error }, 'Failed to get group members');
    next(error);
  }
});

router.put('/groups/:groupId/members/:memberId/role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { role } = req.body;
    
    const member = await socialService.updateMemberRole(
      req.params.groupId,
      req.params.memberId,
      userId,
      role
    );
    res.json({ success: true, member });
  } catch (error) {
    log.error({ error }, 'Failed to update member role');
    next(error);
  }
});

router.get('/groups/:groupId/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const posts = await socialService.getGroupPosts(
      req.params.groupId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    res.json({ success: true, posts });
  } catch (error) {
    log.error({ error }, 'Failed to get group posts');
    next(error);
  }
});

router.post('/groups/:groupId/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { content, contentType, acuId, attachments } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'content required' });
    }
    
    const post = await socialService.createGroupPost(req.params.groupId, userId, {
      content,
      contentType,
      acuId,
      attachments,
    });
    res.json({ success: true, post });
  } catch (error) {
    log.error({ error }, 'Failed to create group post');
    next(error);
  }
});

// Teams
router.get('/teams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const teams = await socialService.getTeams(userId);
    res.json({ success: true, teams });
  } catch (error) {
    log.error({ error }, 'Failed to get teams');
    next(error);
  }
});

router.post('/teams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { name, description, avatarUrl, type, visibility, allowGuestAccess, requireApproval, maxMembers, isPersonal } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'name required' });
    }
    
    const team = await socialService.createTeam(userId, {
      name,
      description,
      avatarUrl,
      type: type || 'PROJECT',
      visibility,
      allowGuestAccess,
      requireApproval,
      maxMembers,
      isPersonal,
    });
    res.json({ success: true, team });
  } catch (error) {
    log.error({ error }, 'Failed to create team');
    next(error);
  }
});

router.get('/teams/:teamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = await socialService.getTeam(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }
    res.json({ success: true, team });
  } catch (error) {
    log.error({ error }, 'Failed to get team');
    next(error);
  }
});

router.put('/teams/:teamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { name, description, avatarUrl, visibility, allowGuestAccess, requireApproval, maxMembers } = req.body;
    
    const team = await socialService.updateTeam(req.params.teamId, userId, {
      name,
      description,
      avatarUrl,
      visibility,
      allowGuestAccess,
      requireApproval,
      maxMembers,
    });
    res.json({ success: true, team });
  } catch (error) {
    log.error({ error }, 'Failed to update team');
    next(error);
  }
});

router.delete('/teams/:teamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    await socialService.deleteTeam(req.params.teamId, userId);
    res.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to delete team');
    next(error);
  }
});

router.post('/teams/:teamId/members', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { userId: targetUserId, role, title } = req.body;
    
    const member = await socialService.addTeamMember(req.params.teamId, targetUserId || userId, {
      role,
      title,
    });
    res.json({ success: true, member });
  } catch (error) {
    log.error({ error }, 'Failed to add team member');
    next(error);
  }
});

router.delete('/teams/:teamId/members/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    await socialService.removeTeamMember(req.params.teamId, req.params.memberId, userId);
    res.json({ success: true });
  } catch (error) {
    log.error({ error }, 'Failed to remove team member');
    next(error);
  }
});

router.post('/teams/:teamId/channels', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { name, description, type } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'name required' });
    }
    
    const channel = await socialService.createChannel(req.params.teamId, userId, {
      name,
      description,
      type,
    });
    res.json({ success: true, channel });
  } catch (error) {
    log.error({ error }, 'Failed to create channel');
    next(error);
  }
});

router.get('/teams/:teamId/channels/:channelId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = await socialService.getChannelMessages(
      req.params.channelId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    res.json({ success: true, messages });
  } catch (error) {
    log.error({ error }, 'Failed to get channel messages');
    next(error);
  }
});

router.post('/teams/:teamId/channels/:channelId/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = await getUserIdFromDID(req.headers['x-did'] as string);
    const { content, contentType, parentId } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'content required' });
    }
    
    const message = await socialService.sendChannelMessage(req.params.channelId, userId, {
      content,
      contentType,
      parentId,
    });
    res.json({ success: true, message });
  } catch (error) {
    log.error({ error }, 'Failed to send message');
    next(error);
  }
});

export default router;
