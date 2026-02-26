# Bridge Document 1: Schema & Invalidation Protocol
**Focus:** Solving the "Ghost Profile" and "Stale Cache" issues.

## 1. The Unified Context Key
To fix the Prisma `upsert` crashes and ensure cache reliability, we must treat the `ContextBundle` as a strict compound key.

**Action:** All services (TS and JS) must use the `ContextIdentifier` interface for any bundle lookup.

```typescript
interface ContextIdentifier {
  userId: string;
  bundleType: 'identity_core' | 'global_prefs' | 'topic' | 'entity' | 'conversation';
  topicProfileId: string | null;
  entityProfileId: string | null;
  conversationId: string | null;
  personaId: string | null;
}
```

## 2. Event-Driven Invalidation (The "Nerve System")
The current system fails because data changes (Body) don't notify the Context Engine (Brain). We must implement an `InvalidationService`.

| Event | Affected Layer | Action |
| :--- | :--- | :--- |
| **New Memory (High Imp)** | L0 (Identity) | `markDirty(userId, 'identity_core')` |
| **Instruction Change** | L1 (Prefs) | `markDirty(userId, 'global_prefs')` |
| **New ACU (High Similarity)** | L2 (Topic) | `markDirty(userId, 'topic', topicId)` |
| **New Message** | L4/L6 (History) | `markDirty(userId, 'conversation', convId)` |

---

## 3. Populating the "Ghost" Tables
The `TopicProfile` and `EntityProfile` tables are currently empty. 
**Bridge Strategy:** 
1.  On every 5th message in a conversation, trigger a "Background Triage".
2.  The Triage identifies the `topicSlug`.
3.  If the `TopicProfile` doesn't exist, create it with `isDirty: true`.
4.  This triggers the `BundleCompiler` to build the L2 layer for the *next* request.
