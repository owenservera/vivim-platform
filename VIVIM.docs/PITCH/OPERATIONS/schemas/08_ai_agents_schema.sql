-- VIVIM Digital Twin Cost Database Schema
-- Module: AI_AGENTS (AI Agent System & Automations)
-- Part of the Production Digital Twin - Intelligent Automation Layer
-- Version: 2.0.0

-- ============================================================================
-- AI AGENT DEFINITIONS & CAPABILITIES
-- ============================================================================

CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Agent classification
    agent_type VARCHAR(50), -- 'assistant', 'analyst', 'automation', 'monitor', 'interface'
    specialization VARCHAR(100), -- 'code_review', 'documentation', 'planning', 'support', 'governance'
    
    -- Model configuration
    llm_model VARCHAR(100), -- 'gpt-4', 'claude-3', 'llama-3', 'custom'
    model_config JSONB, -- {temperature: 0.7, max_tokens: 2000, ...}
    
    -- System prompt and behavior
    system_prompt TEXT,
    personality_profile TEXT,
    
    -- Capabilities
    capabilities TEXT ARRAY, -- ['read_wiki', 'write_tasks', 'comment_proposals', 'analyze_data']
    tools_available JSONB, -- [{tool: 'search_wiki', enabled: true}, ...]
    
    -- Access permissions
    can_read_spaces UUID ARRAY, -- Wiki spaces
    can_write_projects UUID ARRAY, -- Work projects
    can_vote_in_dao BOOLEAN DEFAULT false,
    can_create_proposals BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'training', 'deprecated'
    version INTEGER DEFAULT 1,
    
    -- Usage tracking
    total_interactions INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_agent_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Version snapshot
    system_prompt TEXT,
    model_config JSONB,
    capabilities TEXT ARRAY,
    
    -- Change notes
    change_summary TEXT,
    changes_from_previous TEXT ARRAY,
    
    -- Evaluation
    test_results JSONB, -- {test_cases_run: 100, pass_rate: 0.95}
    human_eval_score DECIMAL(3,2),
    
    is_current BOOLEAN DEFAULT false,
    deployed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(agent_id, version_number)
);

-- ============================================================================
-- AGENT INTERACTIONS & SESSIONS
-- ============================================================================

CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id),
    
    -- Session context
    session_type VARCHAR(50), -- 'chat', 'task_execution', 'monitoring', 'automation'
    context_type VARCHAR(50), -- 'general', 'wiki_article', 'project', 'proposal', 'task'
    context_id UUID, -- Reference to the object being discussed
    
    -- Participants
    initiated_by UUID, -- User who started the session
    participant_ids UUID ARRAY, -- Other humans involved
    
    -- Configuration
    mode VARCHAR(50) DEFAULT 'collaborative', -- 'collaborative', 'autonomous', 'advisory'
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'error'
    
    -- Usage
    message_count INTEGER DEFAULT 0,
    token_count_input INTEGER DEFAULT 0,
    token_count_output INTEGER DEFAULT 0,
    
    -- Cost tracking
    estimated_cost_usd DECIMAL(8,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
    message_number INTEGER NOT NULL,
    
    -- Sender
    sender_type VARCHAR(20), -- 'human', 'agent', 'system'
    sender_id UUID, -- User ID or Agent ID
    
    -- Content
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'code', 'image_description', 'action_result'
    
    -- AI-specific
    raw_llm_response JSONB, -- Full API response
    tokens_input INTEGER,
    tokens_output INTEGER,
    model_used VARCHAR(100),
    
    -- Tool usage
    tools_called JSONB, -- [{tool: 'search_wiki', params: {...}, result: {...}}]
    
    -- Action taken (for agent messages)
    actions_taken JSONB, -- [{action: 'created_task', target_id: '...', status: 'success'}]
    
    -- Feedback
    helpful BOOLEAN,
    feedback_text TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUTOMATED WORKFLOWS & TRIGGERS
-- ============================================================================

CREATE TABLE ai_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Trigger configuration
    trigger_type VARCHAR(50), -- 'scheduled', 'event', 'webhook', 'manual'
    trigger_config JSONB, -- 
    -- For scheduled: {cron: '0 9 * * 1', timezone: 'UTC'}
    -- For event: {entity: 'task', event: 'status_change', condition: 'to_blocked'}
    -- For webhook: {endpoint: '...', method: 'POST'}
    
    -- Workflow steps
    workflow_definition JSONB, -- Ordered array of steps
    -- [{step: 1, action: 'analyze', agent_id: '...', params: {...}}, ...]
    
    -- Execution settings
    parallel_execution BOOLEAN DEFAULT false,
    timeout_minutes INTEGER DEFAULT 30,
    retry_count INTEGER DEFAULT 3,
    
    -- Notifications
    notify_on_complete UUID ARRAY,
    notify_on_failure UUID ARRAY,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES ai_workflows(id),
    
    -- Trigger info
    triggered_by VARCHAR(50), -- 'schedule', 'user', 'event', 'webhook'
    trigger_context JSONB, -- Context that triggered the workflow
    
    -- Execution tracking
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER,
    
    -- Step results
    step_results JSONB, -- [{step: 1, status: 'completed', output: {...}, duration: 120}]
    
    -- Output
    final_output JSONB,
    error_message TEXT,
    
    -- Resources used
    total_tokens_used INTEGER,
    execution_time_seconds INTEGER,
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INTELLIGENT MONITORING & ALERTS
-- ============================================================================

CREATE TABLE ai_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- What to monitor
    monitor_type VARCHAR(100), -- 'work_progress', 'dao_activity', 'wiki_quality', 'cost_anomaly', 'sentiment'
    target_entity VARCHAR(50), -- 'project', 'milestone', 'proposal', 'article', 'general'
    target_id UUID,
    
    -- Evaluation
    evaluation_frequency VARCHAR(50), -- 'realtime', 'hourly', 'daily', 'weekly'
    evaluation_prompt TEXT, -- AI prompt for evaluation
    
    -- Conditions
    alert_conditions JSONB, -- [{condition: 'progress < 50%', severity: 'warning'}, ...]
    
    -- Actions
    auto_actions JSONB, -- [{condition: '...', action: 'notify_slack', params: {...}}]
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_check_at TIMESTAMP WITH TIME ZONE,
    last_alert_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_monitor_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES ai_monitors(id),
    
    -- Alert details
    severity VARCHAR(20), -- 'info', 'warning', 'critical'
    alert_type VARCHAR(100),
    message TEXT,
    
    -- Context
    evaluation_context JSONB, -- Full context that triggered the alert
    ai_analysis TEXT, -- AI-generated analysis of the situation
    ai_recommendations TEXT ARRAY,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'ignored'
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- KNOWLEDGE EXTRACTION & SYNTHESIS
-- ============================================================================

CREATE TABLE ai_knowledge_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source
    source_type VARCHAR(50), -- 'meeting', 'discussion', 'document', 'proposal'
    source_id UUID,
    source_content_hash VARCHAR(64),
    
    -- Extraction settings
    extraction_type VARCHAR(100), -- 'key_points', 'decisions', 'action_items', 'topics', 'relationships'
    agent_id UUID REFERENCES ai_agents(id),
    
    -- Results
    extracted_data JSONB, -- Structured extraction results
    -- {key_points: [...], decisions: [...], action_items: [...], topics: [...]}
    
    -- Confidence
    confidence_score DECIMAL(3,2),
    needs_human_review BOOLEAN,
    
    -- Review status
    reviewed_by UUID,
    review_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'modified'
    reviewed_data JSONB, -- Human-corrected version
    
    -- Actions taken
    auto_created_tasks UUID ARRAY,
    auto_updated_articles UUID ARRAY,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What was summarized
    summary_type VARCHAR(100), -- 'discussion', 'proposal', 'article', 'milestone', 'sprint'
    source_ids UUID ARRAY, -- Multiple sources can be combined
    
    -- Summary content
    short_summary TEXT, -- 1-2 sentences
    detailed_summary TEXT, -- Full paragraph
    bullet_points TEXT ARRAY,
    key_takeaways TEXT ARRAY,
    
    -- Metadata
    target_audience VARCHAR(50), -- 'executive', 'technical', 'general', 'stakeholders'
    length_preference VARCHAR(20), -- 'brief', 'standard', 'detailed'
    
    -- Quality
    ai_confidence DECIMAL(3,2),
    human_rating INTEGER, -- 1-5
    
    -- Usage
    view_count INTEGER DEFAULT 0,
    
    created_by_agent UUID REFERENCES ai_agents(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AGENT COLLABORATION & HANDOFFS
-- ============================================================================

CREATE TABLE ai_agent_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants
    primary_agent_id UUID NOT NULL REFERENCES ai_agents(id),
    collaborating_agent_ids UUID ARRAY,
    
    -- Context
    collaboration_type VARCHAR(100), -- 'task_handoff', 'peer_review', 'joint_analysis', 'escalation'
    context_description TEXT,
    
    -- Workflow
    collaboration_flow JSONB, -- Ordered steps of collaboration
    -- [{agent_id: '...', role: 'analyzer', output_type: 'report'}, ...]
    
    -- Results
    final_output TEXT,
    output_format VARCHAR(50), -- 'report', 'recommendation', 'decision', 'summary'
    
    -- Performance
    handoff_success BOOLEAN,
    iteration_count INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- VIEWS FOR AI ANALYTICS
-- ============================================================================

CREATE VIEW v_ai_agent_performance AS
SELECT 
    a.id,
    a.code,
    a.name,
    a.agent_type,
    a.specialization,
    a.status,
    a.total_interactions,
    a.total_tokens_used,
    COUNT(s.id) as total_sessions,
    AVG(s.message_count) as avg_messages_per_session,
    AVG(s.estimated_cost_usd) as avg_cost_per_session,
    SUM(s.token_count_input + s.token_count_output) as tokens_this_month
FROM ai_agents a
LEFT JOIN ai_sessions s ON a.id = s.agent_id
  AND s.created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY a.id, a.code, a.name, a.agent_type, a.specialization, 
         a.status, a.total_interactions, a.total_tokens_used;

CREATE VIEW v_ai_workflow_status AS
SELECT 
    w.id,
    w.code,
    w.name,
    w.trigger_type,
    w.is_active,
    w.last_run_at,
    w.next_run_at,
    COUNT(we.id) as total_executions,
    COUNT(CASE WHEN we.status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed_executions,
    AVG(we.execution_time_seconds) as avg_execution_time,
    AVG(we.total_tokens_used) as avg_tokens_per_run
FROM ai_workflows w
LEFT JOIN ai_workflow_executions we ON w.id = we.workflow_id
GROUP BY w.id, w.code, w.name, w.trigger_type, w.is_active, w.last_run_at, w.next_run_at;

CREATE VIEW v_ai_monitor_dashboard AS
SELECT 
    m.id,
    m.code,
    m.name,
    m.monitor_type,
    m.is_active,
    m.last_check_at,
    COUNT(CASE WHEN a.status = 'open' THEN 1 END) as open_alerts,
    COUNT(CASE WHEN a.status = 'open' AND a.severity = 'critical' THEN 1 END) as critical_alerts,
    COUNT(CASE WHEN a.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as alerts_this_week
FROM ai_monitors m
LEFT JOIN ai_monitor_alerts a ON m.id = a.monitor_id
GROUP BY m.id, m.code, m.name, m.monitor_type, m.is_active, m.last_check_at;

CREATE VIEW v_ai_cost_summary AS
SELECT 
    DATE_TRUNC('day', s.created_at) as date,
    COUNT(s.id) as sessions_count,
    SUM(s.token_count_input) as total_input_tokens,
    SUM(s.token_count_output) as total_output_tokens,
    SUM(s.estimated_cost_usd) as total_cost_usd,
    AVG(s.estimated_cost_usd) as avg_cost_per_session
FROM ai_sessions s
WHERE s.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', s.created_at)
ORDER BY date DESC;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_ai_agents_type ON ai_agents(agent_type);
CREATE INDEX idx_ai_agents_status ON ai_agents(status);
CREATE INDEX idx_ai_sessions_agent ON ai_sessions(agent_id);
CREATE INDEX idx_ai_sessions_status ON ai_sessions(status);
CREATE INDEX idx_ai_sessions_context ON ai_sessions(context_type, context_id);
CREATE INDEX idx_ai_messages_session ON ai_messages(session_id);
CREATE INDEX idx_ai_workflows_active ON ai_workflows(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_workflow_executions_workflow ON ai_workflow_executions(workflow_id);
CREATE INDEX idx_ai_monitors_active ON ai_monitors(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_monitor_alerts_monitor ON ai_monitor_alerts(monitor_id);
CREATE INDEX idx_ai_monitor_alerts_status ON ai_monitor_alerts(status);
CREATE INDEX idx_ai_knowledge_extractions_source ON ai_knowledge_extractions(source_type, source_id);
CREATE INDEX idx_ai_summaries_type ON ai_summaries(summary_type);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_agents IS 'AI agent definitions with capabilities and configuration';
COMMENT ON TABLE ai_sessions IS 'Conversational sessions with AI agents';
COMMENT ON TABLE ai_workflows IS 'Automated workflows triggered by events or schedules';
COMMENT ON TABLE ai_monitors IS 'Intelligent monitoring agents for various aspects of the project';
COMMENT ON TABLE ai_knowledge_extractions IS 'AI-extracted knowledge from discussions and documents';
COMMENT ON TABLE ai_summaries IS 'AI-generated summaries of various content types';
COMMENT ON VIEW v_ai_agent_performance IS 'Agent usage and performance metrics';
COMMENT ON VIEW v_ai_monitor_dashboard IS 'Active monitors and alert status';
