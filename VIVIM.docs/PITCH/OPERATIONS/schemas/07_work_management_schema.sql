-- VIVIM Digital Twin Cost Database Schema
-- Module: WORK (Open Work Management & Collaboration)
-- Part of the Production Digital Twin - Transparent Task & Project Management
-- Version: 2.0.0

-- ============================================================================
-- PROJECT & PORTFOLIO MANAGEMENT
-- ============================================================================

CREATE TABLE work_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Ownership
    owner_id UUID, -- Team or individual
    stakeholder_ids UUID ARRAY,
    
    -- Strategic alignment
    related_milestone_id INTEGER,
    strategic_goals TEXT ARRAY,
    
    -- Status
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'on_hold', 'completed', 'archived'
    
    -- Timeline
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES work_portfolios(id),
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Categorization
    project_type VARCHAR(100), -- 'product', 'research', 'infrastructure', 'marketing', 'operations'
    priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Connections to other modules
    related_milestone_id INTEGER,
    related_dao_proposal_id UUID, -- If created via DAO proposal
    related_wiki_space_id UUID,
    
    -- Team
    project_lead_id UUID,
    team_member_ids UUID ARRAY,
    
    -- Budget
    budget_allocated DECIMAL(12,2),
    budget_spent DECIMAL(12,2) DEFAULT 0.00,
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Status
    status VARCHAR(50) DEFAULT 'backlog', -- 'backlog', 'planning', 'in_progress', 'review', 'completed', 'cancelled'
    health_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN status = 'completed' THEN 'healthy'
            WHEN status = 'cancelled' THEN 'at_risk'
            WHEN target_end_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled') THEN 'at_risk'
            ELSE 'healthy'
        END
    ) STORED,
    
    -- Timeline
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    
    -- Progress
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Visibility
    visibility VARCHAR(50) DEFAULT 'public', -- 'public', 'internal', 'private'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(portfolio_id, code)
);

-- ============================================================================
-- SPRINT & ITERATION MANAGEMENT
-- ============================================================================

CREATE TABLE work_sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES work_projects(id) ON DELETE CASCADE,
    
    sprint_number INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    goal TEXT,
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'cancelled'
    
    -- Capacity
    capacity_points INTEGER,
    planned_points INTEGER,
    completed_points INTEGER DEFAULT 0,
    
    -- Retrospective
    retrospective_summary TEXT,
    lessons_learned TEXT ARRAY,
    action_items JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(project_id, sprint_number)
);

-- ============================================================================
-- TASK & ISSUE MANAGEMENT
-- ============================================================================

CREATE TABLE work_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES work_projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES work_sprints(id),
    
    -- Identification
    task_code VARCHAR(50), -- e.g., "VIV-123"
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Type and classification
    task_type VARCHAR(50), -- 'feature', 'bug', 'task', 'research', 'documentation', 'design', 'test'
    priority VARCHAR(20) DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
    
    -- Status workflow
    status VARCHAR(50) DEFAULT 'backlog', -- 'backlog', 'todo', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled'
    
    -- Ownership
    creator_id UUID,
    assignee_id UUID,
    reviewer_id UUID,
    
    -- Estimation
    story_points INTEGER,
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Relationships
    parent_task_id UUID REFERENCES work_tasks(id),
    blocked_by UUID ARRAY, -- Task IDs that block this task
    blocks UUID ARRAY, -- Task IDs blocked by this task
    
    -- External links
    related_proposal_id UUID, -- DAO proposal
    related_wiki_article_id UUID,
    related_github_issue VARCHAR(100),
    
    -- AI assistance
    ai_summary TEXT,
    ai_suggested_assignee UUID,
    ai_complexity_estimate VARCHAR(20), -- 'low', 'medium', 'high'
    ai_risk_assessment VARCHAR(20), -- 'low', 'medium', 'high'
    
    -- Visibility
    visibility VARCHAR(50) DEFAULT 'public', -- 'public', 'internal', 'private'
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_task_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    
    changed_by UUID,
    change_reason TEXT,
    
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    
    dependency_type VARCHAR(50) DEFAULT 'blocks', -- 'blocks', 'relates_to', 'duplicates'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(task_id, depends_on_task_id)
);

-- ============================================================================
-- COLLABORATION & COMMUNICATION
-- ============================================================================

CREATE TABLE work_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    
    parent_comment_id UUID REFERENCES work_comments(id),
    
    -- Content
    content TEXT NOT NULL,
    content_type VARCHAR(50) DEFAULT 'text', -- 'text', 'markdown', 'decision', 'question'
    
    -- Author
    author_id UUID,
    
    -- AI analysis
    ai_sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    ai_key_points TEXT ARRAY,
    ai_action_items TEXT ARRAY,
    
    -- Engagement
    reactions JSONB, -- {"👍": 3, "🎉": 2}
    
    -- Resolution (for questions/decisions)
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE work_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    
    file_name VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size_bytes INTEGER,
    file_url TEXT,
    
    -- Storage
    storage_provider VARCHAR(50), -- 'ipfs', 's3', 'local'
    storage_reference VARCHAR(500), -- CID or path
    
    uploaded_by UUID,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    
    user_id UUID NOT NULL,
    
    -- Time tracking
    hours_worked DECIMAL(4,2) NOT NULL,
    work_date DATE NOT NULL,
    
    -- Details
    description TEXT,
    work_type VARCHAR(50), -- 'development', 'design', 'research', 'meeting', 'review'
    
    -- Billing
    billable BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(8,2),
    
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- OPEN COLLABORATION FEATURES
-- ============================================================================

CREATE TABLE work_contributor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES work_tasks(id) ON DELETE CASCADE,
    
    -- Requester
    requester_id UUID,
    requester_type VARCHAR(50), -- 'internal', 'external', 'community'
    
    -- Request details
    message TEXT,
    skills_offered TEXT ARRAY,
    estimated_hours_available INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'withdrawn'
    
    -- Response
    responded_by UUID,
    response_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE work_swarm_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES work_tasks(id),
    project_id UUID REFERENCES work_projects(id),
    
    name VARCHAR(200),
    purpose TEXT,
    
    -- Participants
    organizer_id UUID,
    participant_ids UUID ARRAY,
    
    -- Session details
    session_type VARCHAR(50), -- 'pair_programming', 'design_review', 'bug_hunt', 'planning'
    
    -- Timing
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_duration_minutes INTEGER,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Outcomes
    outcomes TEXT,
    follow_up_tasks UUID ARRAY,
    
    -- Recording (for async participation)
    recording_url TEXT,
    transcript TEXT,
    ai_summary TEXT,
    
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROGRESS TRACKING & REPORTING
-- ============================================================================

CREATE TABLE work_progress_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES work_projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES work_sprints(id) ON DELETE CASCADE,
    
    update_type VARCHAR(50), -- 'daily', 'weekly', 'sprint_review', 'milestone_update'
    
    -- Author
    author_id UUID,
    
    -- Content
    accomplishments TEXT,
    blockers TEXT,
    risks TEXT,
    next_steps TEXT,
    
    -- Metrics
    tasks_completed INTEGER,
    tasks_in_progress INTEGER,
    tasks_blocked INTEGER,
    
    -- AI Analysis
    ai_health_assessment VARCHAR(20), -- 'green', 'yellow', 'red'
    ai_summary TEXT,
    ai_risk_flags TEXT ARRAY,
    
    -- Distribution
    shared_with UUID ARRAY,
    published BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE work_milestones_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id INTEGER NOT NULL,
    
    -- Tracking
    overall_progress DECIMAL(5,2) DEFAULT 0.00,
    tasks_total INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    
    -- Health
    on_track BOOLEAN DEFAULT true,
    risk_factors TEXT ARRAY,
    
    -- Last activity
    last_update_at TIMESTAMP WITH TIME ZONE,
    last_update_by UUID,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- BOUNTIES & INCENTIVES
-- ============================================================================

CREATE TABLE work_bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES work_tasks(id),
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Rewards
    reward_amount DECIMAL(12,2),
    reward_currency VARCHAR(10) DEFAULT 'EUR',
    reward_token_address VARCHAR(100), -- For crypto rewards
    
    -- Eligibility
    required_skills TEXT ARRAY,
    min_reputation_score DECIMAL(8,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'cancelled', 'expired'
    
    -- Assignment
    claimed_by UUID,
    claimed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Review
    review_required BOOLEAN DEFAULT true,
    reviewed_by UUID,
    review_feedback TEXT,
    approved BOOLEAN,
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Visibility
    visibility VARCHAR(50) DEFAULT 'public' -- 'public', 'internal'
);

CREATE TABLE work_bounty_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID NOT NULL REFERENCES work_bounties(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL,
    
    -- Application
    proposal_text TEXT,
    estimated_completion_date DATE,
    portfolio_links TEXT ARRAY,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    
    -- Response
    reviewed_by UUID,
    review_notes TEXT,
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- VIEWS FOR WORK ANALYTICS
-- ============================================================================

CREATE VIEW v_work_project_status AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.portfolio_id,
    pf.name as portfolio_name,
    p.project_type,
    p.priority,
    p.status,
    p.health_status,
    p.progress_percentage,
    p.project_lead_id,
    p.start_date,
    p.target_end_date,
    p.actual_end_date,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
    SUM(t.actual_hours) as total_hours_logged,
    p.budget_allocated,
    p.budget_spent,
    (p.budget_spent / NULLIF(p.budget_allocated, 0) * 100) as budget_utilization
FROM work_projects p
LEFT JOIN work_portfolios pf ON p.portfolio_id = pf.id
LEFT JOIN work_tasks t ON p.id = t.project_id
GROUP BY p.id, p.code, p.name, p.portfolio_id, pf.name, p.project_type, 
         p.priority, p.status, p.health_status, p.progress_percentage, 
         p.project_lead_id, p.start_date, p.target_end_date, p.actual_end_date,
         p.budget_allocated, p.budget_spent;

CREATE VIEW v_work_sprint_metrics AS
SELECT 
    s.id,
    s.project_id,
    p.name as project_name,
    s.sprint_number,
    s.name,
    s.status,
    s.start_date,
    s.end_date,
    s.capacity_points,
    s.planned_points,
    s.completed_points,
    (s.completed_points::decimal / NULLIF(s.planned_points, 0) * 100) as completion_rate,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    AVG(t.actual_hours) as avg_actual_hours_per_task,
    SUM(t.actual_hours) as total_hours
FROM work_sprints s
JOIN work_projects p ON s.project_id = p.id
LEFT JOIN work_tasks t ON s.id = t.sprint_id
GROUP BY s.id, s.project_id, p.name, s.sprint_number, s.name, s.status,
         s.start_date, s.end_date, s.capacity_points, s.planned_points, s.completed_points;

CREATE VIEW v_work_team_velocity AS
SELECT 
    t.assignee_id,
    COUNT(*) as tasks_completed,
    SUM(t.story_points) as points_completed,
    SUM(t.actual_hours) as hours_logged,
    AVG(t.actual_hours) as avg_hours_per_task,
    DATE_TRUNC('week', t.completed_at) as week
FROM work_tasks t
WHERE t.status = 'completed'
  AND t.completed_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY t.assignee_id, DATE_TRUNC('week', t.completed_at)
ORDER BY week DESC;

CREATE VIEW v_work_open_bounties AS
SELECT 
    b.id,
    b.title,
    b.reward_amount,
    b.reward_currency,
    b.required_skills,
    b.status,
    b.expires_at,
    CASE 
        WHEN b.expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN b.expires_at < CURRENT_TIMESTAMP + INTERVAL '7 days' THEN 'expiring_soon'
        ELSE 'active'
    END as urgency,
    b.claimed_by,
    t.title as related_task_title,
    p.name as related_project_name
FROM work_bounties b
LEFT JOIN work_tasks t ON b.task_id = t.id
LEFT JOIN work_projects p ON t.project_id = p.id
WHERE b.status IN ('open', 'in_progress')
  AND b.visibility = 'public';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_work_projects_portfolio ON work_projects(portfolio_id);
CREATE INDEX idx_work_projects_status ON work_projects(status);
CREATE INDEX idx_work_projects_milestone ON work_projects(related_milestone_id);
CREATE INDEX idx_work_sprints_project ON work_sprints(project_id);
CREATE INDEX idx_work_tasks_project ON work_tasks(project_id);
CREATE INDEX idx_work_tasks_sprint ON work_tasks(sprint_id);
CREATE INDEX idx_work_tasks_status ON work_tasks(status);
CREATE INDEX idx_work_tasks_assignee ON work_tasks(assignee_id);
CREATE INDEX idx_work_tasks_due_date ON work_tasks(due_date);
CREATE INDEX idx_work_comments_task ON work_comments(task_id);
CREATE INDEX idx_work_time_entries_task ON work_time_entries(task_id);
CREATE INDEX idx_work_time_entries_user ON work_time_entries(user_id);
CREATE INDEX idx_work_bounties_status ON work_bounties(status);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE work_projects IS 'Projects with open visibility and DAO connections';
COMMENT ON TABLE work_sprints IS 'Agile sprints with capacity planning';
COMMENT ON TABLE work_tasks IS 'Tasks with AI assistance and full transparency';
COMMENT ON TABLE work_bounties IS 'Open bounties for external contributors';
COMMENT ON TABLE work_swarm_sessions IS 'Collaborative working sessions';
COMMENT ON VIEW v_work_project_status IS 'Real-time project health dashboard';
COMMENT ON VIEW v_work_open_bounties IS 'Public bounties available for contribution';
