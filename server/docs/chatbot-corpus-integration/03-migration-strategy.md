# VIVIM Corpus-Chatbot Migration Strategy

**Document Purpose:** Detailed migration plan for gracefully integrating the corpus-chatbot system with zero downtime and backward compatibility.

**Created:** March 27, 2026  
**Migration Type:** Progressive, Non-Breaking  
**Risk Level:** Low

---

## Migration Overview

### Guiding Principles

1. **Zero Breaking Changes:** All existing queries, APIs, and functionality must continue working
2. **Progressive Rollout:** Migrate in phases with rollback capability at each step
3. **Backward Compatible:** New fields are nullable or have defaults
4. **Data Safety:** Full backups before each migration phase
5. **Monitoring:** Track migration progress and system health throughout

### Migration Timeline

```
Phase 1: Corpus Core Models      [Week 1]    ████████░░░░░░░░ 25%
Phase 2: VirtualUser Extensions  [Week 2]    ████████████░░░░ 50%
Phase 3: Conversation Awareness  [Week 3]    ████████████████ 75%
Phase 4: Telemetry + Polish      [Week 4]    ████████████████ 100%
```

---

## Pre-Migration Checklist

### Infrastructure Requirements

- [ ] PostgreSQL 14+ with pgvector extension installed
- [ ] Prisma CLI installed (`npx prisma --version`)
- [ ] Database backup strategy in place
- [ ] Staging environment available for testing
- [ ] Monitoring dashboards configured (Datadog, Grafana, etc.)

### Code Readiness

- [ ] All new TypeScript types defined
- [ ] Repository layer updated with tenant scoping
- [ ] API routes created for corpus operations
- [ ] Unit tests written for new services
- [ ] Integration tests passing in staging

### Database Backup

```bash
# Full database backup before migration
pg_dump -U vivim_user -h localhost vivim_db \
  --format=custom \
  --compress=9 \
  --file=vivim_backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list vivim_backup_$(date +%Y%m%d_%H%M%S).dump

# Store backup in secure location
aws s3 cp vivim_backup_*.dump s3://vivim-backups/pre-migration/
```

---

## Phase 1: Corpus Core Models Migration

**Migration Name:** `add_corpus_core_models`  
**Duration:** 2-4 hours (depends on data volume)  
**Risk:** Low (all new models, no existing changes)

### 1.1 Schema Changes

```prisma
// NEW MODELS (no existing models modified)
model Tenant { }
model CorpusDocument { }
model CorpusDocumentVersion { }
model CorpusChunk { }
model CorpusTopic { }
model CorpusFAQ { }

// NEW ENUMS
enum UserAvatar { STRANGER, ACQUAINTANCE, FAMILIAR, KNOWN }
enum TopicScope { USER, CORPUS }
enum ChunkContentType { prose, code, table, list, mixed }
enum DocumentChangeType { major, minor, patch }
enum OrchestrationIntent { ... }
enum ConversationSentiment { positive, neutral, negative, mixed }
enum ResolutionStatus { resolved, pending, escalated, unknown }
```

### 1.2 Migration Command

```bash
# Step 1: Create migration
npx prisma migrate dev --name add_corpus_core_models

# Step 2: Review generated SQL
cat prisma/migrations/*/migration.sql

# Step 3: Apply to production
npx prisma migrate deploy
```

### 1.3 Generated SQL (Preview)

```sql
-- Create enums
CREATE TYPE "UserAvatar" AS ENUM ('STRANGER', 'ACQUAINTANCE', 'FAMILIAR', 'KNOWN');
CREATE TYPE "TopicScope" AS ENUM ('USER', 'CORPUS');
CREATE TYPE "ChunkContentType" AS ENUM ('prose', 'code', 'table', 'list', 'mixed');
CREATE TYPE "DocumentChangeType" AS ENUM ('major', 'minor', 'patch');
CREATE TYPE "OrchestrationIntent" AS ENUM (...);
CREATE TYPE "ConversationSentiment" AS ENUM ('positive', 'neutral', 'negative', 'mixed');
CREATE TYPE "ResolutionStatus" AS ENUM ('resolved', 'pending', 'escalated', 'unknown');

-- Create tables
CREATE TABLE "tenants" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "chatbotConfig" JSONB,
  "brandVoice" JSONB,
  "guardrails" TEXT[],
  "defaultModel" TEXT DEFAULT 'gpt-4o',
  "embeddingModel" TEXT DEFAULT 'text-embedding-3-small',
  "maxContextTokens" INTEGER DEFAULT 12000,
  "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "corpus_documents" ( ... );
CREATE TABLE "corpus_document_versions" ( ... );
CREATE TABLE "corpus_chunks" ( ... );
CREATE TABLE "corpus_topics" ( ... );
CREATE TABLE "corpus_faqs" ( ... );

-- Create indexes
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");
CREATE INDEX "corpus_chunks_tenantId_embedding_idx" ON "corpus_chunks"("tenantId", "embedding");
-- ... more indexes

-- Enable pgvector (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.4 Post-Migration Verification

```bash
# Verify tables created
psql -U vivim_user -d vivim_db -c "\dt tenants corpus_*"

# Verify enums created
psql -U vivim_user -d vivim_db -c "\dT UserAvatar TopicScope"

# Verify indexes created
psql -U vivim_user -d vivim_db -c "\di tenants_* corpus_*"

# Run health check
curl http://localhost:3000/api/health
```

### 1.5 Rollback Plan

```bash
# Rollback migration
npx prisma migrate resolve --rolled-back add_corpus_core_models

# Or manually drop tables
psql -U vivim_user -d vivim_db <<EOF
DROP TABLE IF EXISTS "corpus_faqs" CASCADE;
DROP TABLE IF EXISTS "corpus_chunks" CASCADE;
DROP TABLE IF EXISTS "corpus_topics" CASCADE;
DROP TABLE IF EXISTS "corpus_document_versions" CASCADE;
DROP TABLE IF EXISTS "corpus_documents" CASCADE;
DROP TABLE IF EXISTS "tenants" CASCADE;
DROP TYPE IF EXISTS "UserAvatar";
DROP TYPE IF EXISTS "TopicScope";
-- ... drop other enums
EOF
```

### 1.6 Success Criteria

- [ ] All tables created successfully
- [ ] All enums created successfully
- [ ] All indexes created successfully
- [ ] pgvector extension enabled
- [ ] No errors in migration logs
- [ ] Health check passes
- [ ] Existing queries unaffected

---

## Phase 2: VirtualUser Extensions Migration

**Migration Name:** `add_virtual_user_chatbot_fields`  
**Duration:** 1-2 hours  
**Risk:** Low (nullable fields, backward compatible)

### 2.1 Schema Changes

```prisma
model VirtualUser {
  // ... EXISTING FIELDS ...

  // NEW: Tenant association (nullable, backward compatible)
  tenantId              String?
  tenant                Tenant? @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  // NEW: Avatar classification (with default)
  currentAvatar         String    @default("STRANGER")
  profileVersion        Int       @default(0)

  // NEW: Relations (additive, no breaking changes)
  conversationIndices   ConversationIndex[]
  profileSnapshots      UserProfileSnapshot[]
}
```

### 2.2 Migration Command

```bash
# Create migration
npx prisma migrate dev --name add_virtual_user_chatbot_fields

# Apply to production
npx prisma migrate deploy
```

### 2.3 Generated SQL (Preview)

```sql
-- Add columns to existing VirtualUser table
ALTER TABLE "virtual_users"
  ADD COLUMN "tenantId" UUID,
  ADD COLUMN "currentAvatar" "UserAvatar" NOT NULL DEFAULT 'STRANGER',
  ADD COLUMN "profileVersion" INTEGER NOT NULL DEFAULT 0;

-- Add foreign key constraint
ALTER TABLE "virtual_users"
  ADD CONSTRAINT "virtual_users_tenantId_fkey"
  FOREIGN KEY ("tenantId")
  REFERENCES "tenants"("id")
  ON DELETE SET NULL;

-- Create index for tenant lookup
CREATE INDEX "virtual_users_tenantId_idx" ON "virtual_users"("tenantId");

-- Create index for avatar classification
CREATE INDEX "virtual_users_currentAvatar_idx" ON "virtual_users"("currentAvatar");
```

### 2.4 Data Migration (Optional)

If you want to pre-populate `currentAvatar` based on existing data:

```sql
-- Update avatar based on existing conversation count
UPDATE "virtual_users" vu
SET "currentAvatar" = CASE
  WHEN vu."conversationCount" = 0 THEN 'STRANGER'
  WHEN vu."conversationCount" <= 5 THEN 'ACQUAINTANCE'
  WHEN vu."conversationCount" <= 20 THEN 'FAMILIAR'
  ELSE 'KNOWN'
END
WHERE "currentAvatar" = 'STRANGER';  -- Only update default values
```

### 2.5 Post-Migration Verification

```bash
# Verify columns added
psql -U vivim_user -d vivim_db -c "\d virtual_users"

# Verify foreign key
psql -U vivim_user -d vivim_db -c "\df virtual_users_tenantId_fkey"

# Test existing VirtualUser queries still work
curl http://localhost:3000/api/v1/virtual/profile?virtualUserId=test-uuid

# Verify new fields are nullable/defaults
psql -U vivim_user -d vivim_db -c "SELECT id, tenantId, currentAvatar FROM virtual_users LIMIT 5"
```

### 2.6 Rollback Plan

```bash
# Rollback migration
npx prisma migrate rollback --name add_virtual_user_chatbot_fields

# Or manually revert
psql -U vivim_user -d vivim_db <<EOF
ALTER TABLE "virtual_users"
  DROP COLUMN IF EXISTS "tenantId",
  DROP COLUMN IF EXISTS "currentAvatar",
  DROP COLUMN IF EXISTS "profileVersion";

DROP INDEX IF EXISTS "virtual_users_tenantId_idx";
DROP INDEX IF EXISTS "virtual_users_currentAvatar_idx";
EOF
```

### 2.7 Success Criteria

- [ ] Columns added successfully
- [ ] Foreign key constraint created
- [ ] Indexes created
- [ ] Existing VirtualUser queries work
- [ ] New fields have correct defaults
- [ ] No NULL constraint violations

---

## Phase 3: Conversation Awareness Models

**Migration Name:** `add_conversation_awareness_models`  
**Duration:** 2-3 hours  
**Risk:** Low (new companion models)

### 3.1 Schema Changes

```prisma
// NEW MODELS
model ConversationIndex {
  id                  String    @id @default(uuid())
  virtualUserId       String
  virtualUser         VirtualUser @relation(...)
  conversationId      String    @unique
  // ... other fields
}

model UserProfileSnapshot {
  id                  String    @id @default(uuid())
  virtualUserId       String
  virtualUser         VirtualUser @relation(...)
  avatar              String
  version             Int       @default(1)
  // ... other fields
}
```

### 3.2 Migration Command

```bash
# Create migration
npx prisma migrate dev --name add_conversation_awareness_models

# Apply to production
npx prisma migrate deploy
```

### 3.3 Generated SQL (Preview)

```sql
-- Create ConversationIndex table
CREATE TABLE "conversation_indices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "virtualUserId" UUID NOT NULL,
  "conversationId" UUID NOT NULL,
  "summary" TEXT NOT NULL,
  "embedding" vector(1536),
  "topics" TEXT[],
  "keyFacts" JSONB,
  "questionsAsked" TEXT[],
  "issuesDiscussed" TEXT[],
  "decisionsReached" TEXT[],
  "actionItems" TEXT[],
  "messageCount" INTEGER,
  "duration" INTEGER,
  "sentiment" "ConversationSentiment",
  "resolutionStatus" "ResolutionStatus",
  "startedAt" TIMESTAMPTZ(6),
  "endedAt" TIMESTAMPTZ(6),
  "lastReferencedAt" TIMESTAMPTZ(6),
  "referenceCount" INTEGER DEFAULT 0,
  "relatedConversationIds" TEXT[],
  "memoryIds" TEXT[],
  "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "conversation_indices_conversationId_unique" UNIQUE ("conversationId"),
  CONSTRAINT "conversation_indices_virtualUserId_fkey"
    FOREIGN KEY ("virtualUserId")
    REFERENCES "virtual_users"("id")
    ON DELETE CASCADE
);

-- Create UserProfileSnapshot table
CREATE TABLE "user_profile_snapshots" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "virtualUserId" UUID NOT NULL,
  "avatar" "UserAvatar" NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "identity" JSONB,
  "preferences" JSONB,
  "topicExpertise" JSONB,
  "behavior" JSONB,
  "activeConcerns" JSONB,
  "evolutionLog" JSONB,
  "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "lastEvolvedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  CONSTRAINT "user_profile_snapshots_virtualUserId_version_unique"
    UNIQUE ("virtualUserId", "version"),
  CONSTRAINT "user_profile_snapshots_virtualUserId_fkey"
    FOREIGN KEY ("virtualUserId")
    REFERENCES "virtual_users"("id")
    ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX "conversation_indices_virtualUserId_startedAt_idx" ON "conversation_indices"("virtualUserId", "startedAt");
CREATE INDEX "conversation_indices_virtualUserId_embedding_idx" ON "conversation_indices"("virtualUserId", "embedding");
CREATE INDEX "conversation_indices_virtualUserId_topics_idx" ON "conversation_indices"("virtualUserId", "topics");
CREATE INDEX "user_profile_snapshots_virtualUserId_idx" ON "user_profile_snapshots"("virtualUserId");
```

### 3.4 Post-Migration Verification

```bash
# Verify tables created
psql -U vivim_user -d vivim_db -c "\d conversation_indices user_profile_snapshots"

# Verify unique constraint on conversationId
psql -U vivim_user -d vivim_db -c "\d conversation_indices"

# Verify vector column
psql -U vivim_user -d vivim_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conversation_indices' AND column_name = 'embedding'"

# Test existing Conversation queries still work
curl http://localhost:3000/api/v1/virtual/conversations?virtualUserId=test-uuid
```

### 3.5 Rollback Plan

```bash
# Rollback migration
npx prisma migrate rollback --name add_conversation_awareness_models

# Or manually drop tables
psql -U vivim_user -d vivim_db <<EOF
DROP TABLE IF EXISTS "user_profile_snapshots" CASCADE;
DROP TABLE IF EXISTS "conversation_indices" CASCADE;
EOF
```

### 3.6 Success Criteria

- [ ] Tables created successfully
- [ ] Foreign key constraints created
- [ ] Unique constraint on conversationId
- [ ] Vector column created
- [ ] Indexes created
- [ ] Existing Conversation queries work
- [ ] No cascade delete issues

---

## Phase 4: Telemetry + Final Polish

**Migration Name:** `add_orchestration_telemetry`  
**Duration:** 1 hour  
**Risk:** Minimal (pure telemetry, no existing model changes)

### 4.1 Schema Changes

```prisma
// NEW MODEL
model OrchestrationLog {
  id                  String    @id @default(uuid())
  tenantId            String
  virtualUserId       String
  conversationId      String
  // ... telemetry fields
}
```

### 4.2 Migration Command

```bash
# Create migration
npx prisma migrate dev --name add_orchestration_telemetry

# Apply to production
npx prisma migrate deploy
```

### 4.3 Generated SQL (Preview)

```sql
-- Create OrchestrationLog table
CREATE TABLE "orchestration_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "virtualUserId" UUID NOT NULL,
  "conversationId" UUID NOT NULL,
  "intent" "OrchestrationIntent" NOT NULL,
  "intentConfidence" DOUBLE PRECISION,
  "avatar" "UserAvatar" NOT NULL,
  "corpusWeight" DOUBLE PRECISION,
  "userWeight" DOUBLE PRECISION,
  "assemblyTimeMs" INTEGER,
  "totalTokens" INTEGER,
  "corpusTokens" INTEGER,
  "userTokens" INTEGER,
  "historyTokens" INTEGER,
  "corpusConfidence" DOUBLE PRECISION,
  "chunksRetrieved" INTEGER,
  "memoriesUsed" INTEGER,
  "proactiveInsights" INTEGER,
  "userSatisfaction" TEXT,
  "followUpRequired" BOOLEAN DEFAULT false,
  "escalated" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "orchestration_logs_tenantId_createdAt_idx" ON "orchestration_logs"("tenantId", "createdAt");
CREATE INDEX "orchestration_logs_virtualUserId_idx" ON "orchestration_logs"("virtualUserId");
CREATE INDEX "orchestration_logs_intent_idx" ON "orchestration_logs"("intent");
```

### 4.4 Post-Migration Verification

```bash
# Verify table created
psql -U vivim_user -d vivim_db -c "\d orchestration_logs"

# Verify indexes
psql -U vivim_user -d vivim_db -c "\di orchestration_logs_*"

# Test inserting a log entry
psql -U vivim_user -d vivim_db -c "INSERT INTO orchestration_logs (tenantId, virtualUserId, conversationId, intent, avatar, corpusWeight, userWeight) VALUES ('test', 'test', 'test', 'CORPUS_QUERY', 'STRANGER', 0.8, 0.2)"
```

### 4.5 Rollback Plan

```bash
# Rollback migration
npx prisma migrate rollback --name add_orchestration_telemetry

# Or manually drop table
psql -U vivim_user -d vivim_db <<EOF
DROP TABLE IF EXISTS "orchestration_logs" CASCADE;
EOF
```

### 4.6 Success Criteria

- [ ] Table created successfully
- [ ] Indexes created
- [ ] Can insert log entries
- [ ] No impact on existing functionality

---

## Post-Migration Tasks

### Database Optimization

```sql
-- Analyze all new tables for query optimization
ANALYZE tenants;
ANALYZE corpus_documents;
ANALYZE corpus_chunks;
ANALYZE corpus_topics;
ANALYZE conversation_indices;
ANALYZE user_profile_snapshots;
ANALYZE orchestration_logs;

-- Verify pgvector indexes are working
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'corpus_chunks'
  AND indexdef LIKE '%vector%';

-- Check table sizes
SELECT
  relname AS table_name,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

### Application Deployment

```bash
# 1. Deploy updated Prisma Client
npx prisma generate

# 2. Restart application servers
pm2 restart vivim-server

# 3. Verify deployment
curl http://localhost:3000/api/health

# 4. Run smoke tests
npm run test:smoke
```

### Monitoring Setup

```typescript
// Add monitoring for new tables
// src/monitoring/corpus-metrics.ts

import { Metrics } from 'prom-client';

const corpusMetrics = {
  corpusChunksTotal: new Metrics.Gauge({
    name: 'corpus_chunks_total',
    help: 'Total number of corpus chunks',
  }),

  corpusQueriesTotal: new Metrics.Counter({
    name: 'corpus_queries_total',
    help: 'Total corpus queries',
    labelNames: ['tenantId', 'intent'],
  }),

  corpusAssemblyDuration: new Metrics.Histogram({
    name: 'corpus_assembly_duration_seconds',
    help: 'Corpus context assembly duration',
    buckets: [0.1, 0.25, 0.5, 1, 2.5],
  }),

  virtualUserAvatarDistribution: new Metrics.Gauge({
    name: 'virtual_user_avatar_distribution',
    help: 'Distribution of user avatars',
    labelNames: ['avatar'],
  }),
};

// Update metrics periodically
setInterval(async () => {
  const chunkCount = await prisma.corpusChunk.count();
  corpusMetrics.corpusChunksTotal.set(chunkCount);

  const avatarCounts = await prisma.virtualUser.groupBy({
    by: ['currentAvatar'],
    _count: true,
  });

  for (const { currentAvatar, _count } of avatarCounts) {
    corpusMetrics.virtualUserAvatarDistribution
      .labels(currentAvatar)
      .set(_count);
  }
}, 60000);
```

---

## Rollback Decision Matrix

| Issue | Severity | Rollback Required? | Mitigation |
|-------|----------|-------------------|------------|
| Migration SQL error | High | Yes | Fix SQL, re-run migration |
| Index creation fails | Medium | No | Create indexes manually post-migration |
| Foreign key constraint violation | High | Yes | Fix data integrity, re-run |
| Application errors post-migration | Medium | Maybe | Fix application code, redeploy |
| Performance degradation | Medium | No | Optimize queries, add indexes |
| Data corruption | Critical | Yes | Restore from backup |

---

## Rollback Procedure (Full)

If a full rollback is required:

```bash
# 1. Stop application
pm2 stop vivim-server

# 2. Restore database from backup
pg_restore -U vivim_user -h localhost -d vivim_db \
  --clean \
  --if-exists \
  vivim_backup_YYYYMMDD_HHMMSS.dump

# 3. Verify restoration
psql -U vivim_user -d vivim_db -c "SELECT COUNT(*) FROM virtual_users"

# 4. Restart application
pm2 start vivim-server

# 5. Verify application health
curl http://localhost:3000/api/health
```

---

## Migration Timeline Summary

| Phase | Migration Name | Duration | Risk | Rollback Time |
|-------|---------------|----------|------|---------------|
| 1 | `add_corpus_core_models` | 2-4 hours | Low | 30 min |
| 2 | `add_virtual_user_chatbot_fields` | 1-2 hours | Low | 15 min |
| 3 | `add_conversation_awareness_models` | 2-3 hours | Low | 30 min |
| 4 | `add_orchestration_telemetry` | 1 hour | Minimal | 10 min |

**Total Migration Time:** 6-10 hours (can be spread across multiple days)  
**Total Rollback Time:** ~2 hours (worst case)

---

## Success Criteria (Overall)

- [ ] All 4 migrations applied successfully
- [ ] No breaking changes to existing APIs
- [ ] All existing queries still work
- [ ] New tables have correct data
- [ ] Vector indexes working correctly
- [ ] Application health checks pass
- [ ] Monitoring dashboards showing green
- [ ] No increase in error rates
- [ ] Performance within acceptable ranges

---

**Document Status:** Ready for Execution  
**Approved By:** [Pending]  
**Migration Start Date:** [TBD]
