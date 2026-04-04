-- VIVIM Digital Twin Cost Database Schema
-- Module: AI_WIKI (Intelligent Knowledge Base System)
-- Part of the Production Digital Twin - AI-Powered Collaborative Wiki
-- Version: 2.0.0

-- ============================================================================
-- KNOWLEDGE BASE STRUCTURE
-- ============================================================================

CREATE TABLE wiki_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Visibility
    visibility VARCHAR(50) DEFAULT 'public', -- 'public', 'internal', 'private', 'restricted'
    allowed_roles VARCHAR(50) ARRAY, -- Who can access
    
    -- Purpose
    space_type VARCHAR(100), -- 'documentation', 'project', 'team', 'product', 'research'
    related_milestone_id INTEGER,
    related_team_id UUID,
    
    -- AI Configuration
    ai_enabled BOOLEAN DEFAULT true,
    ai_auto_summary BOOLEAN DEFAULT true,
    ai_suggested_links BOOLEAN DEFAULT true,
    ai_qa_enabled BOOLEAN DEFAULT true,
    
    -- Content stats
    article_count INTEGER DEFAULT 0,
    total_word_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wiki_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES wiki_spaces(id) ON DELETE CASCADE,
    
    parent_category_id UUID REFERENCES wiki_categories(id),
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    depth INTEGER DEFAULT 0,
    path VARCHAR(500), -- Full path like "Engineering/Backend/API"
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Stats
    article_count INTEGER DEFAULT 0,
    
    UNIQUE(space_id, code)
);

CREATE TABLE wiki_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES wiki_spaces(id) ON DELETE CASCADE,
    category_id UUID REFERENCES wiki_categories(id),
    
    -- Identification
    article_code VARCHAR(100), -- Optional unique identifier
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL, -- URL-friendly title
    
    -- Content (current version)
    content TEXT,
    content_format VARCHAR(50) DEFAULT 'markdown', -- 'markdown', 'html', 'plaintext'
    word_count INTEGER,
    reading_time_minutes INTEGER,
    
    -- AI-Generated Content
    ai_summary TEXT,
    ai_key_points TEXT ARRAY,
    ai_topics UUID ARRAY, -- Links to knowledge_topics
    ai_sentiment VARCHAR(20),
    ai_readability_score DECIMAL(4,2),
    
    -- Metadata
    language VARCHAR(10) DEFAULT 'en',
    tags VARCHAR(100) ARRAY,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'published', 'archived', 'outdated'
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Ownership
    author_id UUID, -- Creator
    owner_id UUID, -- Current maintainer
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    edit_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(space_id, slug)
);

CREATE TABLE wiki_article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Content snapshot
    content TEXT NOT NULL,
    content_format VARCHAR(50),
    word_count INTEGER,
    
    -- Change tracking
    change_summary TEXT, -- Brief description of changes
    change_type VARCHAR(50), -- 'major', 'minor', 'correction', 'revert'
    lines_added INTEGER,
    lines_removed INTEGER,
    lines_modified INTEGER,
    
    -- AI Analysis of changes
    ai_change_summary TEXT, -- AI-generated summary of what changed
    ai_impact_assessment VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    ai_affected_topics UUID ARRAY,
    
    -- Editor
    edited_by UUID,
    edit_comment TEXT,
    
    -- Rollback support
    is_rollback_target BOOLEAN DEFAULT false,
    rolled_back_from UUID REFERENCES wiki_article_versions(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, version_number)
);

-- ============================================================================
-- KNOWLEDGE GRAPH & SEMANTIC CONNECTIONS
-- ============================================================================

CREATE TABLE knowledge_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Topic classification
    topic_type VARCHAR(100), -- 'concept', 'person', 'technology', 'process', 'project', 'milestone'
    
    -- Embeddings for semantic search
    embedding_vector VECTOR(1536), -- OpenAI text-embedding-3-small dimension
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    
    -- Related entities (polymorphic links)
    related_article_ids UUID ARRAY,
    related_milestone_ids INTEGER ARRAY,
    related_team_ids UUID ARRAY,
    related_proposal_ids UUID ARRAY,
    
    -- Knowledge graph connections
    parent_topic_id UUID REFERENCES knowledge_topics(id),
    child_topic_ids UUID ARRAY,
    related_topic_ids UUID ARRAY,
    
    -- Stats
    mention_count INTEGER DEFAULT 0,
    last_mentioned_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source entity
    source_type VARCHAR(50) NOT NULL, -- 'article', 'topic', 'milestone', 'proposal', 'task'
    source_id UUID NOT NULL,
    
    -- Target entity
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    
    -- Connection properties
    connection_type VARCHAR(100), -- 'relates_to', 'depends_on', 'implements', 'documents', 'references'
    strength DECIMAL(3,2), -- 0.00 to 1.00
    is_bidirectional BOOLEAN DEFAULT false,
    
    -- AI-generated connection
    ai_generated BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(3,2),
    ai_reasoning TEXT,
    
    -- Manual override
    manually_verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(source_type, source_id, target_type, target_id, connection_type)
);

CREATE TABLE wiki_article_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    target_article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    
    link_type VARCHAR(50), -- 'inline', 'see_also', 'related', 'prerequisite'
    link_text VARCHAR(200), -- The text used in the link
    
    -- Position in content (for inline links)
    paragraph_number INTEGER,
    context_snippet TEXT,
    
    -- AI analysis
    ai_relevance_score DECIMAL(3,2),
    ai_suggested BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(source_article_id, target_article_id, link_type)
);

-- ============================================================================
-- AI-POWERED Q&A AND ASSISTANCE
-- ============================================================================

CREATE TABLE wiki_qa_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Session metadata
    session_type VARCHAR(50), -- 'general', 'article_specific', 'topic_exploration'
    article_id UUID REFERENCES wiki_articles(id),
    topic_id UUID REFERENCES knowledge_topics(id),
    
    -- User
    user_id UUID,
    session_title VARCHAR(200),
    
    -- AI Configuration
    ai_model VARCHAR(100),
    system_prompt TEXT,
    
    -- Session status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'archived'
    
    -- Stats
    message_count INTEGER DEFAULT 0,
    sources_referenced UUID ARRAY,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wiki_qa_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES wiki_qa_sessions(id) ON DELETE CASCADE,
    message_number INTEGER NOT NULL,
    
    -- Message content
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    
    -- AI-specific fields (for assistant messages)
    ai_model VARCHAR(100),
    tokens_used INTEGER,
    
    -- Source citations (for RAG responses)
    sources JSONB, -- [{"article_id": "...", "relevance": 0.95, "quote": "..."}]
    
    -- Feedback
    helpful BOOLEAN,
    feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wiki_suggested_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    
    -- AI Suggestion
    suggestion_type VARCHAR(100), -- 'clarification', 'update', 'correction', 'link_addition', 'summary_improvement'
    suggested_content TEXT,
    original_content TEXT,
    
    -- Context
    ai_reasoning TEXT,
    confidence_score DECIMAL(3,2),
    
    -- Source of suggestion
    suggested_by VARCHAR(50), -- 'ai_maintenance', 'user_feedback', 'outdated_detection', 'link_suggestion'
    related_change_id UUID, -- Link to work item or proposal that triggered suggestion
    
    -- Review status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'implemented', 'dismissed'
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SEARCH & DISCOVERY
-- ============================================================================

CREATE TABLE wiki_search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    query_text TEXT NOT NULL,
    query_vector VECTOR(1536), -- For semantic search
    
    -- User context
    user_id UUID,
    user_role VARCHAR(50),
    current_page_id UUID, -- What they were viewing when searching
    
    -- Results
    results_count INTEGER,
    clicked_result_id UUID,
    satisfied BOOLEAN, -- User feedback
    
    -- Performance
    search_duration_ms INTEGER,
    search_type VARCHAR(50), -- 'keyword', 'semantic', 'hybrid'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wiki_recently_viewed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    user_id UUID,
    
    view_count INTEGER DEFAULT 1,
    last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, user_id)
);

-- ============================================================================
-- COLLABORATION & FEEDBACK
-- ============================================================================

CREATE TABLE wiki_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    version_id UUID REFERENCES wiki_article_versions(id),
    
    parent_comment_id UUID REFERENCES wiki_comments(id),
    
    -- Content
    content TEXT NOT NULL,
    
    -- Position (for inline comments)
    selected_text TEXT,
    paragraph_number INTEGER,
    position_start INTEGER,
    position_end INTEGER,
    
    -- Author
    author_id UUID,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved', 'archived'
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement
    upvotes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wiki_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID NOT NULL REFERENCES wiki_articles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    subscription_type VARCHAR(50), -- 'all_changes', 'major_changes', 'comments'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, user_id)
);

-- ============================================================================
-- AI AUTOMATION & MAINTENANCE
-- ============================================================================

CREATE TABLE wiki_maintenance_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    task_type VARCHAR(100) NOT NULL, -- 'orphaned_pages', 'broken_links', 'outdated_content', 'missing_links', 'duplicate_content'
    
    -- Target
    article_id UUID REFERENCES wiki_articles(id),
    space_id UUID REFERENCES wiki_spaces(id),
    
    -- AI Assessment
    ai_detected_issue TEXT,
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    ai_suggested_action TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'ignored'
    assigned_to UUID,
    
    -- Resolution
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- VIEWS FOR KNOWLEDGE ANALYTICS
-- ============================================================================

CREATE VIEW v_wiki_popular_articles AS
SELECT 
    a.id,
    a.space_id,
    s.name as space_name,
    a.title,
    a.slug,
    a.status,
    a.view_count,
    a.edit_count,
    a.helpful_count,
    a.comment_count,
    a.published_at,
    a.updated_at,
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - a.updated_at) as days_since_update,
    CASE 
        WHEN a.verified = false AND EXTRACT(DAY FROM CURRENT_TIMESTAMP - a.updated_at) > 90 THEN 'potentially_outdated'
        WHEN a.verified = false THEN 'unverified'
        ELSE 'current'
    END as freshness_status
FROM wiki_articles a
JOIN wiki_spaces s ON a.space_id = s.id
WHERE a.status = 'published'
ORDER BY a.view_count DESC;

CREATE VIEW v_wiki_knowledge_graph AS
SELECT 
    kc.id,
    kc.source_type,
    kc.source_id,
    CASE 
        WHEN kc.source_type = 'article' THEN (SELECT title FROM wiki_articles WHERE id = kc.source_id)
        WHEN kc.source_type = 'topic' THEN (SELECT name FROM knowledge_topics WHERE id = kc.source_id)
        ELSE kc.source_id::text
    END as source_name,
    kc.connection_type,
    kc.target_type,
    kc.target_id,
    CASE 
        WHEN kc.target_type = 'article' THEN (SELECT title FROM wiki_articles WHERE id = kc.target_id)
        WHEN kc.target_type = 'topic' THEN (SELECT name FROM knowledge_topics WHERE id = kc.target_id)
        ELSE kc.target_id::text
    END as target_name,
    kc.strength,
    kc.ai_generated,
    kc.ai_confidence
FROM knowledge_connections kc;

CREATE VIEW v_wiki_maintenance_dashboard AS
SELECT 
    mt.task_type,
    COUNT(*) as open_count,
    COUNT(CASE WHEN mt.severity = 'critical' THEN 1 END) as critical_count,
    COUNT(CASE WHEN mt.severity = 'high' THEN 1 END) as high_count,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - mt.detected_at))/86400) as avg_days_open
FROM wiki_maintenance_tasks mt
WHERE mt.status = 'open'
GROUP BY mt.task_type;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_wiki_articles_space ON wiki_articles(space_id);
CREATE INDEX idx_wiki_articles_category ON wiki_articles(category_id);
CREATE INDEX idx_wiki_articles_status ON wiki_articles(status);
CREATE INDEX idx_wiki_articles_slug ON wiki_articles(slug);
CREATE INDEX idx_wiki_versions_article ON wiki_article_versions(article_id);
CREATE INDEX idx_wiki_links_source ON wiki_article_links(source_article_id);
CREATE INDEX idx_wiki_links_target ON wiki_article_links(target_article_id);
CREATE INDEX idx_knowledge_topics_type ON knowledge_topics(topic_type);
CREATE INDEX idx_knowledge_connections_source ON knowledge_connections(source_type, source_id);
CREATE INDEX idx_knowledge_connections_target ON knowledge_connections(target_type, target_id);
CREATE INDEX idx_wiki_qa_session ON wiki_qa_messages(session_id);
CREATE INDEX idx_wiki_comments_article ON wiki_comments(article_id);

-- Vector index for semantic search (if using pgvector)
-- CREATE INDEX idx_wiki_articles_embedding ON wiki_articles USING ivfflat (embedding_vector vector_cosine_ops);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE wiki_spaces IS 'Knowledge spaces for organizing documentation';
COMMENT ON TABLE wiki_articles IS 'Wiki articles with AI-generated summaries and metadata';
COMMENT ON TABLE wiki_article_versions IS 'Version history with AI change analysis';
COMMENT ON TABLE knowledge_topics IS 'Semantic topics for knowledge graph construction';
COMMENT ON TABLE knowledge_connections IS 'Relationships between knowledge entities';
COMMENT ON TABLE wiki_qa_sessions IS 'AI-powered Q&A conversations';
COMMENT ON TABLE wiki_maintenance_tasks IS 'Automated maintenance issues detected by AI';
