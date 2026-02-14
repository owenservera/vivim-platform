# VIVIM Database Model Classification

**Purpose**: Classify each database model for user isolation

---

## Master Database (PostgreSQL)

Tables that stay in the shared master database:

| Model | Classification | Reason |
|-------|---------------|--------|
| `User` | **MASTER** | Identity anchor - needed for auth |
| `Device` | **MASTER** | Device registry per user |
| `Circle` | **CROSS** | Multi-user grouping |
| `CircleMember` | **CROSS** | Links users to circles |
| `PeerConnection` | **CROSS** | P2P relationships |
| `CaptureAttempt` | **SYSTEM** | System audit log |
| `ProviderStats` | **SYSTEM** | Aggregated stats |
| `SystemCommand` | **SYSTEM** | Global config |
| `SystemAction` | **SYSTEM** | Global config |

---

## User Database (SQLite)

Tables that move to each user's isolated database:

| Model | Classification | Reason |
|-------|---------------|--------|
| `Conversation` | **USER** | User's captured data |
| `Message` | **USER** | User's message history |
| `AtomicChatUnit` | **USER** | User's parsed content |
| `TopicProfile` | **USER** | User's learned topics |
| `EntityProfile` | **USER** | User's learned entities |
| `ContextBundle` | **USER** | User's compiled context |
| `TopicConversation` | **USER** | Topic-conversation links |
| `Memory` | **USER** | User's memories |
| `Notebook` | **USER** | User's notebooks |
| `NotebookEntry` | **USER** | Notebook contents |
| `AiPersona` | **USER** | Custom AI personas |
| `CustomInstruction` | **USER** | User's instructions |
| `ClientPresence` | **USER** | User's device state |
| `SyncCursor` | **USER** | User's sync state |
| `SyncOperation` | **USER** | User's sync log |
| `UserFact` | **USER** | User's facts |
| `UserContextSettings` | **USER** | User's preferences |
| `ConversationCompaction` | **USER** | Compaction history |
| `AcuLink` | **USER** | ACU relationships |

---

## Summary

### Master Database (~9 tables)
- Identity: User, Device
- Cross-user: Circle, CircleMember, PeerConnection
- System: CaptureAttempt, ProviderStats, SystemCommand, SystemAction

### User Database (~20 tables)
- All user data and intelligence

---

## Schema Split Strategy

### Option 1: Two Prisma Schemas

```
prisma/
├── schema-master.prisma   # PostgreSQL - shared tables
└── schema-user.prisma    # SQLite - user tables
```

### Option 2: Single Schema with Runtime Filtering

Keep one schema but route to different databases based on user.

**Recommendation**: Option 1 for cleaner separation.

---

## Cross-User Data Patterns

### What Stays Cross-User
1. **Circles** - Group users together
2. **Sharing** - Share content with specific users
3. **P2P Connections** - Network connections

### How to Handle
- Cross-user data queries go to master DB
- User data queries go to user DB
- JOINs between cross-user and user data need careful routing

---

*Created: 2026-02-14*
