-- VIVIM Digital Twin Cost Database
-- Seed Data: DAO, Wiki, and Work Management
-- Version: 2.0.0

-- ============================================================================
-- DAO ORGANIZATION
-- ============================================================================

INSERT INTO dao_organizations (
    code, name, description, governance_model, voting_mechanism,
    proposal_threshold, quorum_percentage, voting_period_days, execution_delay_hours,
    treasury_address, treasury_balance, treasury_currency,
    support_channels, sla_uptime_percentage,
    reliability_score, performance_score, support_quality_score, cost_effectiveness_score,
    website_url, status, launched_at
) VALUES (
    'vivim-dao', 'VIVIM DAO', 'Decentralized governance for VIVIM - AI-powered collaborative company',
    'hybrid', 'delegated',
    100.00, 20.00, 7, 24,
    '0xVIVIM0000000000000000000000000000000000', 500000.00, 'USDC',
    ARRAY['forum', 'discord', 'snapshot'], 99.90,
    9, 8, 9, 8,
    'https://dao.vivim.io', 'active', '2025-01-01'
);

-- ============================================================================
-- DAO MEMBERS
-- ============================================================================

INSERT INTO dao_members (
    dao_id, member_type, user_id, wallet_address,
    joined_at, membership_tier,
    voting_power_base, reputation_score, token_balance, status
)
SELECT 
    d.id, 'individual', NULL, '0xFounder001',
    '2025-01-01', 'founder',
    10.00, 100.00, 100000.00, 'active'
FROM dao_organizations d WHERE d.code = 'vivim-dao';

INSERT INTO dao_members (
    dao_id, member_type, user_id, wallet_address,
    joined_at, membership_tier,
    voting_power_base, reputation_score, token_balance, status
)
SELECT 
    d.id, 'individual', NULL, '0xCoreDev001',
    '2025-01-15', 'core',
    5.00, 85.00, 50000.00, 'active'
FROM dao_organizations d WHERE d.code = 'vivim-dao';

INSERT INTO dao_members (
    dao_id, member_type, user_id, wallet_address,
    joined_at, membership_tier,
    voting_power_base, reputation_score, token_balance, status
)
SELECT 
    d.id, 'individual', NULL, '0xContributor001',
    '2025-02-01', 'contributor',
    1.00, 45.00, 5000.00, 'active'
FROM dao_organizations d WHERE d.code = 'vivim-dao';

-- ============================================================================
-- DAO PROPOSAL CATEGORIES
-- ============================================================================

INSERT INTO dao_proposal_categories (
    code, name, description, quorum_override, approval_threshold, voting_period_days,
    who_can_create, min_reputation_required, requires_execution
) VALUES
('treasury', 'Treasury Allocation', 'Proposals for spending treasury funds', 25.00, 60.00, 7, ARRAY['core', 'founder'], 50.00, true),
('governance', 'Governance Changes', 'Changes to DAO parameters and structure', 30.00, 66.00, 10, ARRAY['core', 'founder'], 75.00, true),
('technical', 'Technical Decisions', 'Architecture and technical direction', 20.00, 55.00, 5, ARRAY['core', 'contributor'], 30.00, true),
('workstream', 'Workstream Creation', 'Create new workstreams and working groups', 20.00, 50.00, 5, ARRAY['core', 'contributor'], 40.00, true),
('budget', 'Budget Approval', 'Approve budgets for projects', 20.00, 50.00, 5, ARRAY['core', 'founder'], 60.00, true);

-- ============================================================================
-- DAO PROPOSALS
-- ============================================================================

INSERT INTO dao_proposals (
    dao_id, proposal_number, title, description, summary, category_id, author_id,
    proposal_type, proposal_data, related_milestone_id,
    quorum_required, approval_threshold, voting_period_days,
    status, voting_starts_at, voting_ends_at,
    total_votes_for, total_votes_against, total_votes_abstain, participation_percentage
)
SELECT 
    d.id, 1, 'Initial Treasury Allocation for M1-M3', 
    'Allocate 200K USDC for development of first 3 milestones',
    'Initial funding proposal covering Foundation, ACU, and Compose milestones',
    pc.id, dm.id,
    'treasury', '{"amount": 200000, "token": "USDC", "recipient": "0xTreasury"}'::jsonb, 1,
    25.00, 60.00, 7,
    'executed', '2025-01-01', '2025-01-08',
    75000.00, 5000.00, 2000.00, 82.00
FROM dao_organizations d
JOIN dao_proposal_categories pc ON pc.code = 'treasury'
JOIN dao_members dm ON dm.wallet_address = '0xFounder001'
WHERE d.code = 'vivim-dao';

-- ============================================================================
-- WIKI SPACES
-- ============================================================================

INSERT INTO wiki_spaces (
    code, name, description, visibility, allowed_roles,
    space_type, related_milestone_id,
    ai_enabled, ai_auto_summary, ai_suggested_links, ai_qa_enabled,
    created_by, created_at
) VALUES
('product-docs', 'Product Documentation', 'Technical documentation for VIVIM product', 'public', ARRAY['any'], 'product', NULL, true, true, true, true, NULL, '2025-01-01'),
('engineering', 'Engineering Wiki', 'Internal engineering knowledge base', 'internal', ARRAY['employee', 'contractor'], 'documentation', NULL, true, true, true, true, NULL, '2025-01-01'),
('milestones', 'Milestone Documentation', 'Documentation for each development milestone', 'public', ARRAY['any'], 'project', NULL, true, true, true, true, NULL, '2025-01-01'),
('dao-governance', 'DAO Governance', 'Governance proposals, processes, and documentation', 'public', ARRAY['any'], 'documentation', NULL, true, true, true, true, NULL, '2025-01-01'),
('community', 'Community Knowledge', 'Community-contributed guides and resources', 'public', ARRAY['any'], 'documentation', NULL, true, true, true, true, NULL, '2025-01-15');

-- ============================================================================
-- WIKI CATEGORIES
-- ============================================================================

INSERT INTO wiki_categories (space_id, code, name, description, depth, path, sort_order)
SELECT s.id, 'architecture', 'Architecture', 'System architecture documentation', 0, 'Architecture', 1
FROM wiki_spaces s WHERE s.code = 'engineering';

INSERT INTO wiki_categories (space_id, code, name, description, depth, path, sort_order, parent_category_id)
SELECT s.id, 'api', 'API Design', 'API architecture and design patterns', 1, 'Architecture/API', 1, pc.id
FROM wiki_spaces s
JOIN wiki_categories pc ON pc.code = 'architecture' AND pc.space_id = s.id
WHERE s.code = 'engineering';

INSERT INTO wiki_categories (space_id, code, name, description, depth, path, sort_order)
SELECT s.id, 'milestones-m1-m5', 'Milestones 1-5', 'Foundation through Social Layer', 0, 'Milestones 1-5', 1
FROM wiki_spaces s WHERE s.code = 'milestones';

-- ============================================================================
-- WIKI ARTICLES
-- ============================================================================

INSERT INTO wiki_articles (
    space_id, category_id, article_code, title, slug, content, content_format,
    word_count, reading_time_minutes,
    ai_summary, ai_key_points, ai_sentiment, ai_readability_score,
    language, tags, status, published_at, author_id, owner_id,
    view_count, verified, created_at
)
SELECT 
    s.id, c.id, 'M1-OVERVIEW', 'Milestone 1: Foundation - The Sovereign Chat Layer',
    'milestone-1-foundation',
    '# Milestone 1: Foundation

## Overview
The core multi-provider chat interface with BYOK (Bring Your Own Key) integration...

## Key Deliverables
- User Authentication System
- Database Architecture  
- Multi-provider chat interface
- BYOK key management

## Timeline
Months 1-3', 'markdown',
    250, 2,
    'Complete guide to Milestone 1 covering the foundation layer, multi-provider chat, and BYOK architecture.',
    ARRAY['BYOK', 'Multi-provider', 'Foundation', 'Chat Interface'], 'positive', 8.5,
    'en', ARRAY['milestone', 'foundation', 'architecture'], 'published', '2025-01-15',
    NULL, NULL, 150, true, '2025-01-10'
FROM wiki_spaces s
JOIN wiki_categories c ON c.code = 'milestones-m1-m5' AND c.space_id = s.id
WHERE s.code = 'milestones';

INSERT INTO wiki_articles (
    space_id, category_id, article_code, title, slug, content, content_format,
    word_count, reading_time_minutes,
    ai_summary, ai_key_points, ai_sentiment, ai_readability_score,
    language, tags, status, published_at, author_id, owner_id,
    view_count, verified, created_at
)
SELECT 
    s.id, c.id, 'ARCH-OVERVIEW', 'VIVIM System Architecture',
    'system-architecture',
    '# VIVIM Architecture

## High-Level Design
VIVIM is built on a modern, scalable architecture...

## Components
- Frontend: Next.js + React
- Backend: Python/FastAPI
- Database: PostgreSQL + Vector DB
- Infrastructure: Kubernetes on Hetzner', 'markdown',
    500, 5,
    'Comprehensive architecture documentation covering frontend, backend, database, and infrastructure choices.',
    ARRAY['Architecture', 'Next.js', 'Python', 'PostgreSQL', 'Kubernetes'], 'positive', 7.8,
    'en', ARRAY['architecture', 'technical'], 'published', '2025-01-20',
    NULL, NULL, 320, true, '2025-01-15'
FROM wiki_spaces s
JOIN wiki_categories c ON c.code = 'architecture' AND c.space_id = s.id
WHERE s.code = 'engineering';

-- ============================================================================
-- WORK PORTFOLIOS
-- ============================================================================

INSERT INTO work_portfolios (
    code, name, description, owner_id, stakeholder_ids,
    related_milestone_id, strategic_goals,
    status, start_date, target_end_date
) VALUES
('core-product', 'Core Product', 'VIVIM core product development', NULL, NULL, NULL, 
 ARRAY['Launch sovereign chat interface', 'Build composable conversation layer', 'Create context engine'], 
 'active', '2025-01-01', '2025-12-31'),
('platform-infra', 'Platform & Infrastructure', 'Infrastructure, security, and platform', NULL, NULL, NULL,
 ARRAY['GDPR-compliant EU infrastructure', 'Scalable architecture to 1M users', 'Security first design'],
 'active', '2025-01-01', '2025-12-31'),
('dao-growth', 'DAO & Community Growth', 'DAO operations and community building', NULL, NULL, NULL,
 ARRAY['Establish transparent governance', 'Build contributor community', 'Enable open collaboration'],
 'active', '2025-01-01', '2025-12-31');

-- ============================================================================
-- WORK PROJECTS
-- ============================================================================

INSERT INTO work_projects (
    portfolio_id, code, name, description, project_type, priority,
    related_milestone_id, related_dao_proposal_id,
    project_lead_id, team_member_ids,
    budget_allocated, budget_spent, currency_code,
    status, start_date, target_end_date, progress_percentage, visibility
)
SELECT 
    p.id, 'VIV-M1', 'M1: Foundation Implementation', 
    'Implement the sovereign chat layer with multi-provider support and BYOK',
    'product', 'critical',
    1, NULL,
    NULL, NULL,
    90000.00, 45000.00, 'EUR',
    'in_progress', '2025-01-01', '2025-03-31', 45.00, 'public'
FROM work_portfolios p WHERE p.code = 'core-product';

INSERT INTO work_projects (
    portfolio_id, code, name, description, project_type, priority,
    related_milestone_id, related_dao_proposal_id,
    project_lead_id, team_member_ids,
    budget_allocated, budget_spent, currency_code,
    status, start_date, target_end_date, progress_percentage, visibility
)
SELECT 
    p.id, 'VIV-M2', 'M2: Atomic Chat Units', 
    'Build the ACU data architecture for owned, portable, composable conversation objects',
    'product', 'critical',
    2, NULL,
    NULL, NULL,
    75000.00, 15000.00, 'EUR',
    'in_progress', '2025-03-01', '2025-05-31', 15.00, 'public'
FROM work_portfolios p WHERE p.code = 'core-product';

INSERT INTO work_projects (
    portfolio_id, code, name, description, project_type, priority,
    related_milestone_id, related_dao_proposal_id,
    project_lead_id, team_member_ids,
    budget_allocated, budget_spent, currency_code,
    status, start_date, target_end_date, progress_percentage, visibility
)
SELECT 
    p.id, 'INF-DEPLOY', 'Infrastructure Deployment', 
    'Set up production infrastructure on Hetzner with CI/CD, monitoring, and security',
    'infrastructure', 'high',
    NULL, NULL,
    NULL, NULL,
    25000.00, 18000.00, 'EUR',
    'in_progress', '2025-01-01', '2025-02-28', 75.00, 'internal'
FROM work_portfolios p WHERE p.code = 'platform-infra';

-- ============================================================================
-- WORK SPRINTS
-- ============================================================================

INSERT INTO work_sprints (
    project_id, sprint_number, name, goal, start_date, end_date,
    status, capacity_points, planned_points, completed_points
)
SELECT 
    p.id, 1, 'Sprint 1: Auth & Database',
    'Complete user authentication system and database architecture',
    '2025-01-01', '2025-01-14',
    'completed', 40, 35, 38
FROM work_projects p WHERE p.code = 'VIV-M1';

INSERT INTO work_sprints (
    project_id, sprint_number, name, goal, start_date, end_date,
    status, capacity_points, planned_points, completed_points
)
SELECT 
    p.id, 2, 'Sprint 2: Provider Integration',
    'Integrate OpenAI, Anthropic, and Google providers',
    '2025-01-15', '2025-01-28',
    'completed', 40, 38, 40
FROM work_projects p WHERE p.code = 'VIV-M1';

INSERT INTO work_sprints (
    project_id, sprint_number, name, goal, start_date, end_date,
    status, capacity_points, planned_points, completed_points
)
SELECT 
    p.id, 3, 'Sprint 3: BYOK & UI',
    'Implement BYOK management and unified chat UI',
    '2025-01-29', '2025-02-11',
    'active', 40, 40, 15
FROM work_projects p WHERE p.code = 'VIV-M1';

-- ============================================================================
-- WORK TASKS
-- ============================================================================

INSERT INTO work_tasks (
    project_id, sprint_id, task_code, title, description,
    task_type, priority, status,
    creator_id, assignee_id,
    story_points, estimated_hours, actual_hours,
    created_at, started_at, due_date, completed_at, visibility
)
SELECT 
    p.id, s.id, 'VIV-101', 'Implement OAuth authentication',
    'Set up OAuth with Google, GitHub, and Apple providers',
    'feature', 'high', 'completed',
    NULL, NULL, 5, 16, 14,
    '2025-01-01', '2025-01-02', '2025-01-10', '2025-01-09', 'public'
FROM work_projects p
JOIN work_sprints s ON s.project_id = p.id AND s.sprint_number = 1
WHERE p.code = 'VIV-M1';

INSERT INTO work_tasks (
    project_id, sprint_id, task_code, title, description,
    task_type, priority, status,
    creator_id, assignee_id,
    story_points, estimated_hours, actual_hours,
    created_at, started_at, due_date, completed_at, visibility
)
SELECT 
    p.id, s.id, 'VIV-102', 'Design PostgreSQL schema',
    'Design multi-tenant PostgreSQL schema with proper indexing',
    'task', 'high', 'completed',
    NULL, NULL, 3, 12, 10,
    '2025-01-01', '2025-01-03', '2025-01-08', '2025-01-07', 'public'
FROM work_projects p
JOIN work_sprints s ON s.project_id = p.id AND s.sprint_number = 1
WHERE p.code = 'VIV-M1';

INSERT INTO work_tasks (
    project_id, sprint_id, task_code, title, description,
    task_type, priority, status,
    creator_id, assignee_id,
    story_points, estimated_hours,
    created_at, started_at, due_date, visibility
)
SELECT 
    p.id, s.id, 'VIV-301', 'BYOK key encryption',
    'Implement secure key storage with HSM or equivalent',
    'feature', 'critical', 'in_progress',
    NULL, NULL, 8, 24,
    '2025-01-29', '2025-01-30', '2025-02-10', 'public'
FROM work_projects p
JOIN work_sprints s ON s.project_id = p.id AND s.sprint_number = 3
WHERE p.code = 'VIV-M1';

-- ============================================================================
-- WORK BOUNTIES (Open to Community)
-- ============================================================================

INSERT INTO work_bounties (
    title, description,
    reward_amount, reward_currency,
    required_skills, min_reputation_score,
    status, visibility,
    created_at, expires_at
) VALUES
('Documentation: API Reference', 'Create comprehensive API documentation for the VIVIM REST API',
 500.00, 'USDC', ARRAY['technical_writing', 'api_design'], 10.00, 'open', 'public', '2025-01-20', '2025-03-01'),

('Community Tutorial: BYOK Setup', 'Write a step-by-step tutorial for setting up BYOK with different providers',
 300.00, 'USDC', ARRAY['technical_writing', 'user_experience'], 5.00, 'open', 'public', '2025-01-25', '2025-03-01'),

('Bug Fix: Mobile Responsiveness', 'Fix responsive design issues on mobile devices',
 400.00, 'USDC', ARRAY['css', 'react', 'responsive_design'], 15.00, 'open', 'public', '2025-01-28', '2025-02-28'),

('Translation: Spanish UI', 'Translate the VIVIM interface to Spanish',
 600.00, 'USDC', ARRAY['translation', 'spanish', 'localization'], 0.00, 'open', 'public', '2025-02-01', '2025-04-01');

-- ============================================================================
-- DISCUSSION FORUMS
-- ============================================================================

INSERT INTO discussion_forums (
    code, name, description, forum_type,
    who_can_post, who_can_view,
    requires_approval, moderators,
    topic_count, post_count,
    related_wiki_space_id,
    created_at
)
SELECT 
    'general', 'General Discussion', 'General community discussion and announcements', 'general',
    ARRAY['anyone'], ARRAY['anyone'],
    false, NULL,
    5, 45,
    s.id, '2025-01-01'
FROM wiki_spaces s WHERE s.code = 'community';

INSERT INTO discussion_forums (
    code, name, description, forum_type,
    who_can_post, who_can_view,
    requires_approval, moderators,
    topic_count, post_count,
    created_at
) VALUES
('tech-discussion', 'Technical Discussion', 'Deep technical discussions about architecture and implementation', 'technical',
 ARRAY['members'], ARRAY['anyone'], false, NULL, 8, 67, '2025-01-01'),

('governance', 'Governance', 'DAO governance discussions and proposal feedback', 'governance',
 ARRAY['members'], ARRAY['anyone'], false, NULL, 3, 23, '2025-01-01'),

('help-support', 'Help & Support', 'Community help and troubleshooting', 'help',
 ARRAY['anyone'], ARRAY['anyone'], false, NULL, 12, 89, '2025-01-15'),

('showcase', 'Showcase', 'Show off what you have built with VIVIM', 'showcase',
 ARRAY['anyone'], ARRAY['anyone'], false, NULL, 2, 12, '2025-01-20');

-- ============================================================================
-- COMMUNITY PROFILES
-- ============================================================================

INSERT INTO community_profiles (
    user_id, display_name, bio, avatar_url,
    expertise_areas, interests,
    contributor_since, is_core_team, is_verified,
    follower_count, following_count, contributions_count,
    profile_visibility, created_at
) VALUES
(NULL, 'Alex Developer', 'Backend engineer passionate about privacy-first AI. Building the foundation of VIVIM.',
 NULL, ARRAY['backend', 'security', 'distributed_systems'], ARRAY['ai', 'privacy', 'open_source'],
 '2025-01-01', true, true, 45, 12, 23, 'public', '2025-01-01'),

(NULL, 'Sarah Designer', 'Product designer focused on user experience. Making AI accessible to everyone.',
 NULL, ARRAY['ux_design', 'product_design', 'user_research'], ARRAY['design_systems', 'accessibility'],
 '2025-01-10', true, true, 34, 18, 15, 'public', '2025-01-10'),

(NULL, 'CommunityMember1', 'Early contributor excited about the vision. Learning and contributing where I can.',
 NULL, ARRAY['documentation', 'testing'], ARRAY['web3', 'ai', 'community'],
 '2025-01-20', false, false, 5, 42, 3, 'public', '2025-01-20'),

(NULL, 'MLResearcher', 'Machine learning researcher. Interested in training data and model alignment.',
 NULL, ARRAY['machine_learning', 'nlp', 'ethics'], ARRAY['responsible_ai', 'data_governance'],
 '2025-02-01', false, true, 12, 8, 2, 'public', '2025-02-01');

-- ============================================================================
-- REPUTATION BADGES
-- ============================================================================

INSERT INTO reputation_badges (
    code, name, description, badge_type, rarity,
    icon_url, color_hex,
    criteria_type, criteria_config,
    reputation_boost, is_active
) VALUES
('first-contribution', 'First Contribution', 'Made your first contribution to VIVIM', 'achievement', 'common',
 NULL, '#CD7F32',
 'activity_count', '{"activity_type": "contribution", "min_count": 1}'::jsonb,
 5.00, true),

('wiki-contributor', 'Wiki Contributor', 'Contributed 5 improvements to the wiki', 'contribution', 'common',
 NULL, '#C0C0C0',
 'activity_count', '{"activity_type": "wiki_edit", "min_count": 5}'::jsonb,
 10.00, true),

('bug-hunter', 'Bug Hunter', 'Found and reported 3 verified bugs', 'skill', 'rare',
 NULL, '#FFD700',
 'activity_count', '{"activity_type": "bug_report", "min_count": 3}'::jsonb,
 25.00, true),

('governance-participant', 'Governance Participant', 'Voted on 5 proposals', 'governance', 'rare',
 NULL, '#4169E1',
 'activity_count', '{"activity_type": "proposal_vote", "min_count": 5}'::jsonb,
 30.00, true),

('core-contributor', 'Core Contributor', 'Consistently contributed over 3 months', 'milestone', 'epic',
 NULL, '#9932CC',
 'score_threshold', '{"reputation_min": 80, "consistency_months": 3}'::jsonb,
 50.00, true),

('founding-member', 'Founding Member', 'One of the first 100 community members', 'special', 'legendary',
 NULL, '#FF4500',
 'manual_award', '{}'::jsonb,
 100.00, true);

-- ============================================================================
-- KNOWLEDGE CONNECTIONS (Linking entities)
-- ============================================================================

-- Link articles to milestones
INSERT INTO knowledge_connections (
    source_type, source_id, target_type, target_id,
    connection_type, strength, ai_generated, ai_confidence
)
SELECT 
    'article', a.id, 'milestone', m.id::text::uuid,
    'documents', 0.95, false, 1.00
FROM wiki_articles a
JOIN milestones m ON m.id = 1
WHERE a.article_code = 'M1-OVERVIEW';

-- Link tasks to wiki articles
INSERT INTO knowledge_connections (
    source_type, source_id, target_type, target_id,
    connection_type, strength, ai_generated, ai_confidence
)
SELECT 
    'task', t.id, 'article', a.id,
    'requires_knowledge', 0.80, true, 0.85
FROM work_tasks t
JOIN wiki_articles a ON a.article_code = 'M1-OVERVIEW'
WHERE t.task_code = 'VIV-101';

-- Link proposals to workstreams (when implemented)
INSERT INTO knowledge_connections (
    source_type, source_id, target_type, target_id,
    connection_type, strength, ai_generated, ai_confidence
)
SELECT 
    'proposal', p.id, 'milestone', m.id::text::uuid,
    'funds', 0.90, false, 1.00
FROM dao_proposals p
CROSS JOIN milestones m
WHERE m.id = 1
LIMIT 1;
