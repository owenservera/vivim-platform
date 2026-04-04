# Backend / SDK Audit

## API Endpoints (Express Backend)

| Name / Route | Input Parameters | Return Type | Status | Edge Cases / Gaps |
|--------------|------------------|-------------|--------|-------------------|
| `GET /api/v1/health/detailed` | None | `DetailedHealthResponse` | Working | DB connection failure returns 503 |
| `GET /api/v1/detect-provider` | `url` (query) | `DetectProviderResponse` | Working | Returns null if unsupported URL |
| `POST /api/v1/capture` | `url`, `options` | `CaptureResponse` | Working | Timeouts on long chats; headless extraction issues |
| `GET /api/v1/conversations` | `limit`, `offset`, `provider`, `orderBy` | `ConversationResponse[]` | Working | Complex filtering may be slow |
| `GET /api/v1/conversations/:id` | `id` (path) | `ConversationResponse` | Working | 404 if not found |
| `DELETE /api/v1/conversations/:id` | `id` (path) | `{ message: string }` | Working | Cascading deletes need monitoring |
| `GET /api/v1/conversations/stats/summary`| None | `StatsResponse` | Working | - |
| `GET /api/v1/conversations/recent` | `limit` (query) | `ConversationResponse[]` | Working | - |
| `GET /api/v1/providers` | None | `ProvidersResponse` | Working | - |
| `GET /api/admin/system/health` | Auth Token | System Metrics | Partial | Hardcoded mock data for disk & network |
| `GET /api/admin/database/stats` | Auth Token | DB Metrics | Partial | Uses mocked schema/stats instead of Prisma introspect |
| `POST /api/admin/crdt/sync` | Payload | Status | Partial | Integration with CRDTSyncService stubbed |
| `GET /api/admin/network/peers` | Auth Token | Peer List | Partial | Missing libp2p `NetworkNode` hookups |

## SDK Methods

| Node / Method | Input | Return | Status | Notes |
|---------------|-------|--------|--------|-------|
| `IdentityNode.create` | `CreateIdentityOptions` | `Identity` | Stable | DID generation based on ed25519 |
| `StorageNode.store` | `data`, `options` | `StorageResult` | Stable | AES-256 encryption. Missing actual IPFS deals. |
| `MemoryNode.semanticSearch` | `query`, `limit` | `Memory[]` | Stable | Relies on vector DB backend |
| `AIChatNode.send` | `message`, `context` | `Message` | Stable | Integrates with ContextEngine |
| `ChatLinkNexus.importFromLink` | `url`, `options` | `Conversation` | Working | Supports multiple AI providers |
| `SocialNode.shareToCircle` | `circleId`, `payload` | `void` | Beta | Federation partially implemented |

## Authentication and Authorization
- **Web App**: Uses Passport.js with Google OAuth20 for standard users. Fallback to API keys and DID-based signatures for SDK interactions.
- **JWT**: Tokens issued and verified via standard Bearer headers. Missing automatic token refresh/rotation mechanism.
- **Capabilities**: The SDK implements a CapBAC (Capability-Based Access Control) model verifying actions against DIDs (`CapabilityManager`).

## Data Models / Schema (Prisma)
- **User**: `id`, `did`, `publicKey`, `email`, `trustScore`, `status`
- **Device**: `userId`, `deviceId`, `platform`, `publicKey`
- **Conversation**: `id`, `provider`, `sourceUrl`, `ownerId`, `totalTokens`, `title`
- **Message**: `conversationId`, `role`, `parts`, `status`, `messageIndex`
- **AtomicChatUnit (ACU)**: `id`, `authorDid`, `content`, `type`, `embedding` (vector), `qualityOverall`
- **Memory**: `userId`, `content`, `embedding`, `importance`, `topics`
- **Circle**: `ownerId`, `name`, `isPublic`

## Third-Party Integrations
- **AI SDKs**: `@ai-sdk/openai`, `anthropic`, `google`, `xai` for completions and embeddings.
- **Extraction**: `playwright` for headless browser conversation scraping.
- **Database**: PostgreSQL (with `pgvector` for embeddings) + Redis for caching/sessions.

## Async Patterns
- Extensively uses `Promise.all` for parallel context retrieval (`ParallelContextPipeline`).
- Message queues via `p-queue` and circuit breakers via `opossum`.
- Event streams (SSE) for capture sync and WebSocket (`socket.io`) for real-time CRDT updates.

## Error Handling
- Shared `@vivim/common` package contains an `ErrorReporter` tracking `NETWORK_TIMEOUT`, `SYNC_CONFLICT`, etc.
- PWA sync engine buffers offline operations into Dexie and syncs on connection.
- Express backend has a global error handling middleware standardizing error structures.

## Environment Behavior
- `ENABLE_SWAGGER` flagged by env variables.
- Dev mode CORS allows wildcard origins (`*`), which is strict in production.
- Rate limiting disabled in Dev, enforced in Production.