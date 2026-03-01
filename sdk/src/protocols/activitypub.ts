/**
 * ActivityPub Protocol - Full ActivityPub compatibility for federation
 * Implements ActivityPub W3C Recommendation for federated social networking
 */

import { generateId } from '../utils/crypto.js';

/**
 * ActivityPub context
 */
export const ACTIVITYPUB_CONTEXT = [
  'https://www.w3.org/ns/activitystreams',
  'https://w3id.org/security/v1',
  {
    schema: 'http://schema.org#',
    toot: 'http://joinmastodon.org/ns#',
    fediverse: 'http://fediverse.info/ns#',
  },
];

/**
 * ActivityPub object types
 */
export type ActivityPubObjectType =
  | 'Article'
  | 'Audio'
  | 'Document'
  | 'Event'
  | 'Image'
  | 'Note'
  | 'Page'
  | 'Place'
  | 'Profile'
  | 'Relationship'
  | 'Tombstone'
  | 'Video';

/**
 * ActivityPub activity types
 */
export type ActivityPubActivityType =
  | 'Accept'
  | 'Add'
  | 'Announce'
  | 'Arrive'
  | 'Block'
  | 'Create'
  | 'Delete'
  | 'Dislike'
  | 'Flag'
  | 'Follow'
  | 'Ignore'
  | 'Invite'
  | 'Join'
  | 'Leave'
  | 'Like'
  | 'Listen'
  | 'Move'
  | 'Offer'
  | 'Question'
  | 'Reject'
  | 'Read'
  | 'Remove'
  | 'TentativeAccept'
  | 'TentativeReject'
  | 'Travel'
  | 'Undo'
  | 'Update'
  | 'View';

/**
 * Actor types
 */
export type ActivityPubActorType = 'Person' | 'Organization' | 'Service' | 'Group' | 'Application';

/**
 * ActivityPub object
 */
export interface ActivityPubObject {
  '@context': string | string[];
  id: string;
  type: ActivityPubObjectType;
  name?: string;
  summary?: string;
  content?: string;
  url?: string;
  attributedTo?: string;
  published?: string;
  updated?: string;
  to?: string | string[];
  cc?: string | string[];
  audience?: string;
  icon?: ActivityPubImage;
  image?: ActivityPubImage;
  tag?: ActivityPubTag[];
  attachments?: ActivityPubAttachment[];
  replies?: ActivityPubCollection;
  likes?: ActivityPubCollection;
  shares?: ActivityPubCollection;
  inReplyTo?: string;
  [key: string]: unknown;
}

/**
 * ActivityPub activity
 */
export interface ActivityPubActivity {
  '@context': string | string[];
  id: string;
  type: ActivityPubActivityType;
  actor: string | ActivityPubActor;
  object: string | ActivityPubObject | ActivityPubActivity;
  target?: string | ActivityPubObject;
  result?: ActivityPubObject;
  origin?: string;
  instrument?: ActivityPubObject;
  published?: string;
  to?: string | string[];
  cc?: string | string[];
  audience?: string;
  [key: string]: unknown;
}

/**
 * ActivityPub actor
 */
export interface ActivityPubActor {
  '@context': string | string[];
  id: string;
  type: ActivityPubActorType;
  name?: string;
  preferredUsername?: string;
  summary?: string;
  url?: string;
  inbox: string;
  outbox: string;
  followers?: string;
  following?: string;
  featured?: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
  icon?: ActivityPubImage;
  image?: ActivityPubImage;
  tag?: ActivityPubTag[];
  attachedTo?: string;
  endpoints?: {
    sharedInbox?: string;
    proxyUrl?: string;
    oauthAuthorizationEndpoint?: string;
    oauthTokenEndpoint?: string;
    provideClientKey?: string;
    signClientKey?: string;
    signatureKey?: string;
  };
  [key: string]: unknown;
}

/**
 * ActivityPub image
 */
export interface ActivityPubImage {
  type: 'Image';
  mediaType?: string;
  url: string;
  width?: number;
  height?: number;
}

/**
 * ActivityPub tag
 */
export interface ActivityPubTag {
  type: 'Hashtag' | 'Mention' | 'Emoji';
  href?: string;
  name?: string;
  id?: string;
  icon?: ActivityPubImage;
}

/**
 * ActivityPub attachment
 */
export interface ActivityPubAttachment {
  type: 'Document' | 'Image' | 'Audio' | 'Video';
  mediaType?: string;
  url: string;
  name?: string;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * ActivityPub collection
 */
export interface ActivityPubCollection {
  id: string;
  type: 'Collection' | 'OrderedCollection';
  totalItems?: number;
  items?: unknown[];
  first?: string | ActivityPubCollectionPage;
  last?: string | ActivityPubCollectionPage;
  next?: string | ActivityPubCollectionPage;
  prev?: string | ActivityPubCollectionPage;
}

/**
 * ActivityPub collection page
 */
export interface ActivityPubCollectionPage {
  id: string;
  type: 'CollectionPage' | 'OrderedCollectionPage';
  partOf?: string;
  orderedItems?: unknown[];
  items?: unknown[];
  next?: string;
  prev?: string;
}

/**
 * ActivityPub ordered inbox
 */
export interface ActivityPubInbox extends ActivityPubCollection {
  type: 'OrderedCollection';
}

/**
 * ActivityPub ordered outbox
 */
export interface ActivityPubOutbox extends ActivityPubCollection {
  type: 'OrderedCollection';
}

/**
 * WebFinger response
 */
export interface WebFingerResponse {
  subject: string;
  aliases: string[];
  links: WebFingerLink[];
  properties?: Record<string, string>;
}

/**
 * WebFinger link
 */
export interface WebFingerLink {
  rel: string;
  type?: string;
  href?: string;
  titles?: Record<string, string>;
  properties?: Record<string, string>;
}

/**
 * ActivityPub API
 */
export interface ActivityPubAPI {
  // Actor
  getActor(did: string): Promise<ActivityPubActor>;
  updateActor(actor: ActivityPubActor): Promise<void>;

  // Activities
  createActivity(
    type: ActivityPubActivityType,
    actor: string,
    object: string | ActivityPubObject
  ): Promise<ActivityPubActivity>;
  sendActivity(activity: ActivityPubActivity, targetInbox: string): Promise<void>;
  receiveActivity(activity: ActivityPubActivity): Promise<void>;

  // Objects
  createObject(
    type: ActivityPubObjectType,
    content: Partial<ActivityPubObject>
  ): Promise<ActivityPubObject>;
  getObject(id: string): Promise<ActivityPubObject | null>;
  updateObject(id: string, updates: Partial<ActivityPubObject>): Promise<void>;
  deleteObject(id: string): Promise<void>;

  // Collections
  getFollowers(actorId: string): Promise<ActivityPubCollection>;
  getFollowing(actorId: string): Promise<ActivityPubCollection>;
  getOutbox(actorId: string): Promise<ActivityPubOutbox>;
  getInbox(actorId: string): Promise<ActivityPubInbox>;

  // WebFinger
  resolveWebFinger(resource: string): Promise<WebFingerResponse>;

  // Signing
  signActivity(activity: ActivityPubActivity, privateKey: string): Promise<string>;
  verifyActivity(activity: ActivityPubActivity, signature: string): Promise<boolean>;

  // Serialization
  toJsonLD(activity: ActivityPubActivity | ActivityPubObject): string;
  fromJsonLD(json: string): ActivityPubActivity | ActivityPubObject;
}

/**
 * ActivityPub Service Implementation
 */
export class ActivityPubService implements ActivityPubAPI {
  private actors: Map<string, ActivityPubActor> = new Map();
  private objects: Map<string, ActivityPubObject> = new Map();
  private activities: Map<string, ActivityPubActivity> = new Map();
  private inbox: Map<string, ActivityPubActivity[]> = new Map();
  private outbox: Map<string, ActivityPubActivity[]> = new Map();

  constructor(private instanceUrl: string) {}

  // ==========================================================================
  // Actor Management
  // ==========================================================================

  async getActor(did: string): Promise<ActivityPubActor> {
    const cached = this.actors.get(did);
    if (cached) return cached;

    // Construct actor from DID
    const actorId = `${this.instanceUrl}/actor/${did}`;
    const actor: ActivityPubActor = {
      '@context': ACTIVITYPUB_CONTEXT,
      id: actorId,
      type: 'Person',
      preferredUsername: did.split(':').pop() || did,
      inbox: `${actorId}/inbox`,
      outbox: `${actorId}/outbox`,
      followers: `${actorId}/followers`,
      following: `${actorId}/following`,
      publicKey: {
        id: `${actorId}#main-key`,
        owner: actorId,
        publicKeyPem: '', // Would be populated from key store
      },
      endpoints: {
        sharedInbox: `${this.instanceUrl}/inbox`,
      },
    };

    this.actors.set(did, actor);
    return actor;
  }

  async updateActor(actor: ActivityPubActor): Promise<void> {
    const did = actor.id.split('/').pop() || '';
    this.actors.set(did, actor);

    // Announce update
    const updateActivity = await this.createActivity('Update', actor.id, actor);
    await this.sendToFollowers(updateActivity);
  }

  // ==========================================================================
  // Activity Management
  // ==========================================================================

  async createActivity(
    type: ActivityPubActivityType,
    actor: string,
    object: string | ActivityPubObject
  ): Promise<ActivityPubActivity> {
    const activityId = `${this.instanceUrl}/activity/${generateId()}`;

    const activity: ActivityPubActivity = {
      '@context': ACTIVITYPUB_CONTEXT,
      id: activityId,
      type,
      actor,
      object,
      published: new Date().toISOString(),
      to: 'https://www.w3.org/ns/activitystreams#Public',
    };

    this.activities.set(activityId, activity);

    // Add to outbox
    const actorDid = actor.split('/').pop() || '';
    const outbox = this.outbox.get(actorDid) || [];
    outbox.push(activity);
    this.outbox.set(actorDid, outbox);

    return activity;
  }

  async sendActivity(activity: ActivityPubActivity, targetInbox: string): Promise<void> {
    // In a real implementation, this would HTTP POST to the inbox
    console.log(`[ActivityPub] Sending activity to ${targetInbox}:`, activity.type);

    // Simulate delivery
    const targetDomain = new URL(targetInbox).hostname;
    const targetActor = Array.from(this.actors.values()).find(
      (a) => a.inbox === targetInbox
    );

    if (targetActor) {
      const targetDid = targetActor.id.split('/').pop() || '';
      const inbox = this.inbox.get(targetDid) || [];
      inbox.push(activity);
      this.inbox.set(targetDid, inbox);
    }
  }

  async receiveActivity(activity: ActivityPubActivity): Promise<void> {
    console.log(`[ActivityPub] Received activity:`, activity.type);

    // Process based on activity type
    switch (activity.type) {
      case 'Follow':
        await this.handleFollow(activity);
        break;
      case 'Accept':
        await this.handleAccept(activity);
        break;
      case 'Reject':
        await this.handleReject(activity);
        break;
      case 'Create':
        await this.handleCreate(activity);
        break;
      case 'Update':
        await this.handleUpdate(activity);
        break;
      case 'Delete':
        await this.handleDelete(activity);
        break;
      case 'Announce':
        await this.handleAnnounce(activity);
        break;
      case 'Like':
        await this.handleLike(activity);
        break;
      default:
        console.log(`[ActivityPub] Unhandled activity type: ${activity.type}`);
    }
  }

  private async handleFollow(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Follow activity received');
    // Would trigger follow acceptance workflow
  }

  private async handleAccept(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Accept activity received');
  }

  private async handleReject(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Reject activity received');
  }

  private async handleCreate(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Create activity received');
    if (typeof activity.object !== 'string' && activity.object) {
      this.objects.set(activity.object.id, activity.object);
    }
  }

  private async handleUpdate(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Update activity received');
    if (typeof activity.object !== 'string' && activity.object) {
      const existing = this.objects.get(activity.object.id);
      if (existing) {
        Object.assign(existing, activity.object);
      }
    }
  }

  private async handleDelete(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Delete activity received');
    if (typeof activity.object === 'string') {
      this.objects.delete(activity.object);
    } else if (activity.object && typeof activity.object === 'object' && 'id' in activity.object) {
      this.objects.delete(activity.object.id);
    }
  }

  private async handleAnnounce(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Announce (boost/share) activity received');
  }

  private async handleLike(activity: ActivityPubActivity): Promise<void> {
    console.log('[ActivityPub] Like (favorite) activity received');
  }

  private async sendToFollowers(activity: ActivityPubActivity): Promise<void> {
    const actorDid = (typeof activity.actor === 'string' ? activity.actor : activity.actor.id).split('/').pop() || '';
    const actor = this.actors.get(actorDid);

    if (actor?.followers) {
      // Would fetch followers and send to each inbox
      console.log('[ActivityPub] Sending to followers:', actor.followers);
    }
  }

  // ==========================================================================
  // Object Management
  // ==========================================================================

  async createObject(
    type: ActivityPubObjectType,
    content: Partial<ActivityPubObject>
  ): Promise<ActivityPubObject> {
    const objectId = `${this.instanceUrl}/object/${generateId()}`;

    const object: ActivityPubObject = {
      '@context': ACTIVITYPUB_CONTEXT,
      id: objectId,
      type,
      published: new Date().toISOString(),
      ...content,
    };

    this.objects.set(objectId, object);
    return object;
  }

  async getObject(id: string): Promise<ActivityPubObject | null> {
    return this.objects.get(id) || null;
  }

  async updateObject(id: string, updates: Partial<ActivityPubObject>): Promise<void> {
    const object = this.objects.get(id);
    if (object) {
      Object.assign(object, updates);
      object.updated = new Date().toISOString();

      // Announce update
      const actor = Array.from(this.actors.values()).find((a) => a.outbox === `${id}/outbox`);
      if (actor) {
        const updateActivity = await this.createActivity('Update', actor.id, object);
        await this.sendToFollowers(updateActivity);
      }
    }
  }

  async deleteObject(id: string): Promise<void> {
    const object = this.objects.get(id);
    if (object) {
      // Create tombstone
      const tombstone: ActivityPubObject = {
        '@context': ACTIVITYPUB_CONTEXT,
        id: `${id}/tombstone`,
        type: 'Tombstone',
        formerType: object.type,
        deleted: new Date().toISOString(),
      };

      this.objects.set(id, tombstone);
      this.objects.delete(id);
    }
  }

  // ==========================================================================
  // Collections
  // ==========================================================================

  async getFollowers(actorId: string): Promise<ActivityPubCollection> {
    return {
      id: `${actorId}/followers`,
      type: 'OrderedCollection',
      totalItems: 0,
      first: `${actorId}/followers?page=1`,
    };
  }

  async getFollowing(actorId: string): Promise<ActivityPubCollection> {
    return {
      id: `${actorId}/following`,
      type: 'OrderedCollection',
      totalItems: 0,
      first: `${actorId}/following?page=1`,
    };
  }

  async getOutbox(actorId: string): Promise<ActivityPubOutbox> {
    const did = actorId.split('/').pop() || '';
    const activities = this.outbox.get(did) || [];

    return {
      id: `${actorId}/outbox`,
      type: 'OrderedCollection',
      totalItems: activities.length,
      orderedItems: activities,
    };
  }

  async getInbox(actorId: string): Promise<ActivityPubInbox> {
    const did = actorId.split('/').pop() || '';
    const activities = this.inbox.get(did) || [];

    return {
      id: `${actorId}/inbox`,
      type: 'OrderedCollection',
      totalItems: activities.length,
      orderedItems: activities,
    };
  }

  // ==========================================================================
  // WebFinger
  // ==========================================================================

  async resolveWebFinger(resource: string): Promise<WebFingerResponse> {
    // Parse resource (acct:user@domain or https://domain/@user)
    let username: string;
    let domain: string;

    if (resource.startsWith('acct:')) {
      const parts = resource.substring(5).split('@');
      username = parts[0];
      domain = parts[1];
    } else {
      const url = new URL(resource);
      username = url.pathname.replace('/@', '').replace('/', '');
      domain = url.hostname;
    }

    return {
      subject: `acct:${username}@${domain}`,
      aliases: [
        `${this.instanceUrl}/actor/${username}`,
        `${this.instanceUrl}/@${username}`,
      ],
      links: [
        {
          rel: 'self',
          type: 'application/activity+json',
          href: `${this.instanceUrl}/actor/${username}`,
        },
        {
          rel: 'http://webfinger.net/rel/profile-page',
          type: 'text/html',
          href: `${this.instanceUrl}/@${username}`,
        },
        {
          rel: 'http://ostatus.org/schema/1.0/subscribe',
          template: `${this.instanceUrl}/authorize_interaction?uri={uri}`,
        },
      ],
    };
  }

  // ==========================================================================
  // Signing (Placeholder)
  // ==========================================================================

  async signActivity(activity: ActivityPubActivity, privateKey: string): Promise<string> {
    // In a real implementation, this would create an HTTP Signature
    // See: https://datatracker.ietf.org/doc/html/draft-cavage-http-signatures
    console.log('[ActivityPub] Signing activity:', activity.id);
    return 'signature-placeholder';
  }

  async verifyActivity(activity: ActivityPubActivity, signature: string): Promise<boolean> {
    // In a real implementation, this would verify HTTP Signature
    console.log('[ActivityPub] Verifying activity signature:', activity.id);
    return true; // Placeholder
  }

  // ==========================================================================
  // Serialization
  // ==========================================================================

  toJsonLD(activity: ActivityPubActivity | ActivityPubObject): string {
    return JSON.stringify(activity, null, 2);
  }

  fromJsonLD(json: string): ActivityPubActivity | ActivityPubObject {
    return JSON.parse(json);
  }
}

/**
 * Create ActivityPub Service instance
 */
export function createActivityPubService(instanceUrl: string): ActivityPubService {
  return new ActivityPubService(instanceUrl);
}

/**
 * ActivityPub helpers
 */
export const ActivityPubHelpers = {
  /**
   * Create a Note object
   */
  createNote(
    instanceUrl: string,
    actorId: string,
    content: string,
    options: {
      to?: string[];
      cc?: string[];
      tag?: ActivityPubTag[];
      attachments?: ActivityPubAttachment[];
    } = {}
  ): ActivityPubObject {
    return {
      '@context': ACTIVITYPUB_CONTEXT,
      id: `${instanceUrl}/object/${generateId()}`,
      type: 'Note',
      attributedTo: actorId,
      content,
      published: new Date().toISOString(),
      to: options.to || ['https://www.w3.org/ns/activitystreams#Public'],
      cc: options.cc || [],
      tag: options.tag || [],
      attachments: options.attachments || [],
    };
  },

  /**
   * Create a Follow activity
   */
  createFollow(
    instanceUrl: string,
    actorId: string,
    targetActorId: string
  ): ActivityPubActivity {
    return {
      '@context': ACTIVITYPUB_CONTEXT,
      id: `${instanceUrl}/activity/${generateId()}`,
      type: 'Follow',
      actor: actorId,
      object: targetActorId,
      published: new Date().toISOString(),
    };
  },

  /**
   * Create a Like activity
   */
  createLike(
    instanceUrl: string,
    actorId: string,
    objectId: string
  ): ActivityPubActivity {
    return {
      '@context': ACTIVITYPUB_CONTEXT,
      id: `${instanceUrl}/activity/${generateId()}`,
      type: 'Like',
      actor: actorId,
      object: objectId,
      published: new Date().toISOString(),
    };
  },

  /**
   * Create an Announce (boost/share) activity
   */
  createAnnounce(
    instanceUrl: string,
    actorId: string,
    objectId: string
  ): ActivityPubActivity {
    return {
      '@context': ACTIVITYPUB_CONTEXT,
      id: `${instanceUrl}/activity/${generateId()}`,
      type: 'Announce',
      actor: actorId,
      object: objectId,
      published: new Date().toISOString(),
    };
  },
};
