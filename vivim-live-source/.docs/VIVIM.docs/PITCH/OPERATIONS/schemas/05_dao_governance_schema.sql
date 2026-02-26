-- VIVIM Digital Twin Cost Database Schema
-- Module: DAO (Decentralized Autonomous Organization Governance)
-- Part of the Production Digital Twin - Open Collaborative Governance
-- Version: 2.0.0

-- ============================================================================
-- DAO CORE: ORGANIZATION & MEMBERSHIP
-- ============================================================================

CREATE TABLE dao_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- DAO Configuration
    governance_model VARCHAR(100), -- 'token_based', 'reputation_based', 'hybrid', 'soulbound'
    voting_mechanism VARCHAR(100), -- 'direct', 'delegated', 'liquid', 'quadratic'
    proposal_threshold DECIMAL(10,2), -- Minimum to create proposal
    quorum_percentage DECIMAL(5,2), -- Minimum participation for valid vote
    
    -- Treasury
    treasury_address VARCHAR(100),
    treasury_balance DECIMAL(18,8),
    treasury_currency VARCHAR(10),
    
    -- Parameters
    voting_period_days INTEGER DEFAULT 7,
    execution_delay_hours INTEGER DEFAULT 24,
    min_participation_percentage DECIMAL(5,2) DEFAULT 10.00,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'dissolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    launched_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dao_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    
    -- Member identity (can be individual or team)
    member_type VARCHAR(50), -- 'individual', 'team', 'agent'
    user_id UUID, -- Reference to users/employees
    wallet_address VARCHAR(100),
    
    -- Membership details
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    membership_tier VARCHAR(50), -- 'contributor', 'core', 'founder', 'advisor'
    
    -- Voting power calculation
    voting_power_base DECIMAL(10,2) DEFAULT 1.00,
    reputation_score DECIMAL(10,2) DEFAULT 0.00,
    token_balance DECIMAL(18,8) DEFAULT 0.00,
    total_voting_power DECIMAL(10,2) GENERATED ALWAYS AS (
        voting_power_base + (reputation_score * 0.1) + (token_balance * 0.01)
    ) STORED,
    
    -- Delegation
    delegated_to UUID REFERENCES dao_members(id),
    delegated_power DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    last_activity_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(dao_id, wallet_address)
);

CREATE TABLE dao_member_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES dao_members(id) ON DELETE CASCADE,
    
    -- Reputation dimensions
    contribution_score DECIMAL(8,2) DEFAULT 0.00,
    governance_score DECIMAL(8,2) DEFAULT 0.00,
    technical_score DECIMAL(8,2) DEFAULT 0.00,
    community_score DECIMAL(8,2) DEFAULT 0.00,
    
    -- Calculated reputation
    overall_reputation DECIMAL(8,2) GENERATED ALWAYS AS (
        (contribution_score * 0.4) + 
        (governance_score * 0.2) + 
        (technical_score * 0.3) + 
        (community_score * 0.1)
    ) STORED,
    
    -- Reputation history
    reputation_history JSONB, -- [{date: '2025-01', score: 100}, ...]
    
    -- Badges/Achievements
    badges UUID ARRAY, -- References to badge_definitions
    
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROPOSALS & GOVERNANCE
-- ============================================================================

CREATE TABLE dao_proposal_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Voting parameters per category
    quorum_override DECIMAL(5,2), -- NULL means use DAO default
    approval_threshold DECIMAL(5,2) DEFAULT 50.00, -- Percentage needed to pass
    voting_period_days INTEGER,
    
    -- Permissions
    who_can_create VARCHAR(50) ARRAY, -- ['core', 'contributor', 'any']
    min_reputation_required DECIMAL(8,2) DEFAULT 0.00,
    
    -- Execution
    requires_execution BOOLEAN DEFAULT true,
    execution_automatic BOOLEAN DEFAULT false
);

CREATE TABLE dao_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    proposal_number INTEGER, -- Sequential within DAO
    
    -- Basic info
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    summary TEXT, -- AI-generated or manual summary
    category_id UUID REFERENCES dao_proposal_categories(id),
    
    -- Author
    author_id UUID NOT NULL REFERENCES dao_members(id),
    
    -- Content
    proposal_type VARCHAR(100), -- 'funding', 'governance', 'technical', 'treasury', 'membership'
    proposal_data JSONB, -- Flexible content based on type
    -- {amount: 10000, recipient: '0x...', token: 'USDC'} for funding
    -- {parameter: 'voting_period', new_value: 14} for governance
    
    -- Milestone connection
    related_milestone_id INTEGER,
    related_team_id UUID,
    
    -- Voting parameters (snapshot at creation)
    quorum_required DECIMAL(5,2),
    approval_threshold DECIMAL(5,2),
    voting_period_days INTEGER,
    
    -- Timeline
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    voting_starts_at TIMESTAMP WITH TIME ZONE,
    voting_ends_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'passed', 'rejected', 'executed', 'cancelled'
    
    -- Results (updated after voting)
    total_votes_for DECIMAL(18,8) DEFAULT 0,
    total_votes_against DECIMAL(18,8) DEFAULT 0,
    total_votes_abstain DECIMAL(18,8) DEFAULT 0,
    total_voting_power_used DECIMAL(18,8) DEFAULT 0,
    participation_percentage DECIMAL(5,2),
    
    -- Discussion
    discussion_url TEXT,
    forum_topic_id VARCHAR(100)
);

CREATE TABLE dao_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES dao_members(id),
    
    -- Vote details
    vote_choice VARCHAR(20) NOT NULL, -- 'for', 'against', 'abstain'
    voting_power_used DECIMAL(18,8) NOT NULL,
    
    -- Optional reasoning
    reasoning TEXT,
    
    -- Delegation tracking
    is_delegated BOOLEAN DEFAULT false,
    original_voter_id UUID REFERENCES dao_members(id),
    
    -- Blockchain/verification
    vote_hash VARCHAR(100),
    signed_message TEXT,
    
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(proposal_id, voter_id)
);

CREATE TABLE dao_proposal_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES dao_proposals(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES dao_members(id),
    
    parent_comment_id UUID REFERENCES dao_proposal_comments(id),
    
    content TEXT NOT NULL,
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative' (AI-analyzed)
    
    -- Engagement
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- TREASURY & FINANCIAL MANAGEMENT
-- ============================================================================

CREATE TABLE dao_treasury_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    
    asset_type VARCHAR(50), -- 'token', 'nft', 'stablecoin', 'native'
    token_address VARCHAR(100),
    token_symbol VARCHAR(20),
    token_name VARCHAR(100),
    token_decimals INTEGER DEFAULT 18,
    
    balance DECIMAL(36,18),
    balance_usd DECIMAL(18,2),
    
    -- Valuation
    price_usd DECIMAL(18,8),
    price_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    requires_multisig BOOLEAN DEFAULT false,
    min_signers INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dao_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES dao_proposals(id),
    
    -- Transaction details
    transaction_type VARCHAR(50), -- 'income', 'expense', 'transfer', 'swap'
    asset_id UUID REFERENCES dao_treasury_assets(id),
    
    amount DECIMAL(36,18),
    amount_usd DECIMAL(18,2),
    
    -- Counterparty
    from_address VARCHAR(100),
    to_address VARCHAR(100),
    
    -- Purpose
    description TEXT,
    category VARCHAR(100), -- 'development', 'marketing', 'operations', 'grant', 'dividend'
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    
    -- Blockchain ref
    tx_hash VARCHAR(100),
    block_number INTEGER,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE dao_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    
    budget_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Budget scope
    category VARCHAR(100),
    milestone_id INTEGER,
    team_id UUID,
    
    -- Amounts
    total_budget DECIMAL(18,2),
    spent_amount DECIMAL(18,2) DEFAULT 0.00,
    remaining_amount DECIMAL(18,2) GENERATED ALWAYS AS (total_budget - spent_amount) STORED,
    
    currency_code VARCHAR(3) DEFAULT 'EUR',
    
    -- Period
    start_date DATE,
    end_date DATE,
    
    -- Approval
    approved_by_proposal_id UUID REFERENCES dao_proposals(id),
    
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'proposed', 'approved', 'active', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WORKSTREAMS & WORKING GROUPS
-- ============================================================================

CREATE TABLE dao_workstreams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Purpose
    mission TEXT,
    goals JSONB, -- [{"goal": "Build X", "deadline": "2025-06-01"}]
    
    -- Leadership
    lead_id UUID REFERENCES dao_members(id),
    co_leads UUID ARRAY, -- References to dao_members
    
    -- Team
    member_ids UUID ARRAY, -- References to dao_members
    
    -- Budget
    budget_id UUID REFERENCES dao_budgets(id),
    
    -- Timeline
    start_date DATE,
    end_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'proposed', -- 'proposed', 'active', 'completed', 'archived'
    
    -- Created from proposal
    created_by_proposal_id UUID REFERENCES dao_proposals(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(dao_id, code)
);

CREATE TABLE dao_workstream_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstream_id UUID NOT NULL REFERENCES dao_workstreams(id) ON DELETE CASCADE,
    
    update_type VARCHAR(50), -- 'weekly', 'milestone', 'ad_hoc'
    
    -- Content
    accomplishments TEXT,
    blockers TEXT,
    next_steps TEXT,
    
    -- Metrics
    tasks_completed INTEGER,
    tasks_in_progress INTEGER,
    budget_spent_period DECIMAL(18,2),
    
    -- AI Summary
    ai_summary TEXT,
    sentiment VARCHAR(20),
    
    reported_by UUID REFERENCES dao_members(id),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GOVERNANCE DELEGATION & REPRESENTATION
-- ============================================================================

CREATE TABLE dao_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dao_id UUID NOT NULL REFERENCES dao_organizations(id) ON DELETE CASCADE,
    
    delegator_id UUID NOT NULL REFERENCES dao_members(id),
    delegate_id UUID NOT NULL REFERENCES dao_members(id),
    
    -- Scope
    delegation_scope VARCHAR(50), -- 'all', 'category', 'proposal'
    category_id UUID REFERENCES dao_proposal_categories(id),
    specific_proposal_id UUID REFERENCES dao_proposals(id),
    
    -- Power
    voting_power_delegated DECIMAL(18,8),
    
    -- Duration
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,
    is_revocable BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'revoked', 'expired'
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    
    UNIQUE(delegator_id, delegate_id, delegation_scope, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'), COALESCE(specific_proposal_id, '00000000-0000-0000-0000-000000000000'))
);

-- ============================================================================
-- VIEWS FOR DAO ANALYTICS
-- ============================================================================

CREATE VIEW v_dao_proposal_summary AS
SELECT 
    p.id,
    p.proposal_number,
    p.dao_id,
    d.name as dao_name,
    p.title,
    p.proposal_type,
    pc.name as category,
    p.status,
    p.author_id,
    m.wallet_address as author_address,
    p.created_at,
    p.voting_starts_at,
    p.voting_ends_at,
    p.total_votes_for,
    p.total_votes_against,
    p.total_votes_abstain,
    p.participation_percentage,
    CASE 
        WHEN p.total_votes_for > p.total_votes_against THEN 'passing'
        WHEN p.total_votes_for < p.total_votes_against THEN 'failing'
        ELSE 'tied'
    END as current_outcome
FROM dao_proposals p
JOIN dao_organizations d ON p.dao_id = d.id
LEFT JOIN dao_proposal_categories pc ON p.category_id = pc.id
LEFT JOIN dao_members m ON p.author_id = m.id;

CREATE VIEW v_dao_member_activity AS
SELECT 
    m.id,
    m.dao_id,
    d.name as dao_name,
    m.wallet_address,
    m.membership_tier,
    m.total_voting_power,
    m.reputation_score,
    mr.overall_reputation,
    mr.contribution_score,
    mr.governance_score,
    m.joined_at,
    m.status,
    COUNT(DISTINCT p.id) as proposals_created,
    COUNT(DISTINCT v.id) as votes_cast,
    COUNT(DISTINCT c.id) as comments_made
FROM dao_members m
JOIN dao_organizations d ON m.dao_id = d.id
LEFT JOIN dao_member_reputation mr ON m.id = mr.member_id
LEFT JOIN dao_proposals p ON m.id = p.author_id
LEFT JOIN dao_votes v ON m.id = v.voter_id
LEFT JOIN dao_proposal_comments c ON m.id = c.author_id
GROUP BY m.id, m.dao_id, d.name, m.wallet_address, m.membership_tier, 
         m.total_voting_power, m.reputation_score, mr.overall_reputation,
         mr.contribution_score, mr.governance_score, m.joined_at, m.status;

CREATE VIEW v_dao_treasury_summary AS
SELECT 
    t.dao_id,
    d.name as dao_name,
    COUNT(DISTINCT t.id) as asset_count,
    SUM(t.balance_usd) as total_value_usd,
    SUM(CASE WHEN t.asset_type = 'stablecoin' THEN t.balance_usd ELSE 0 END) as stablecoin_value_usd,
    SUM(CASE WHEN t.asset_type = 'native' THEN t.balance_usd ELSE 0 END) as native_token_value_usd
FROM dao_treasury_assets t
JOIN dao_organizations d ON t.dao_id = d.id
WHERE t.is_active = true
GROUP BY t.dao_id, d.name;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_dao_members_dao ON dao_members(dao_id);
CREATE INDEX idx_dao_members_wallet ON dao_members(wallet_address);
CREATE INDEX idx_dao_proposals_dao ON dao_proposals(dao_id);
CREATE INDEX idx_dao_proposals_status ON dao_proposals(status);
CREATE INDEX idx_dao_proposals_category ON dao_proposals(category_id);
CREATE INDEX idx_dao_votes_proposal ON dao_votes(proposal_id);
CREATE INDEX idx_dao_votes_voter ON dao_votes(voter_id);
CREATE INDEX idx_dao_transactions_dao ON dao_transactions(dao_id);
CREATE INDEX idx_dao_transactions_status ON dao_transactions(status);
CREATE INDEX idx_dao_workstreams_dao ON dao_workstreams(dao_id);
CREATE INDEX idx_dao_workstreams_status ON dao_workstreams(status);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE dao_organizations IS 'DAO organizations with governance configuration';
COMMENT ON TABLE dao_members IS 'DAO members with voting power and reputation';
COMMENT ON TABLE dao_proposals IS 'Governance proposals with voting and execution';
COMMENT ON TABLE dao_votes IS 'Individual votes on proposals';
COMMENT ON TABLE dao_treasury_assets IS 'Treasury holdings and valuations';
COMMENT ON TABLE dao_workstreams IS 'Working groups and project teams within the DAO';
COMMENT ON VIEW v_dao_proposal_summary IS 'Consolidated view of all proposals with current status';
COMMENT ON VIEW v_dao_member_activity IS 'Member participation and reputation metrics';
