-- =============================================================================
-- VIVIM Digital Twin - Token & Vesting Schema (Module 11)
-- =============================================================================
-- Token management, vesting schedules, staking, and delegation
-- Supports DAO Charter and Tokenomics Founding Document
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: TOKEN REGISTRY
-- -----------------------------------------------------------------------------

CREATE TABLE token_registry (
    token_id SERIAL PRIMARY KEY,
    token_symbol VARCHAR(20) NOT NULL UNIQUE,
    token_name VARCHAR(100) NOT NULL,
    token_type VARCHAR(50) CHECK (token_type IN ('governance', 'work', 'nft', 'reward', 'stablecoin')),
    contract_address VARCHAR(100),
    chain_id INTEGER,
    decimals INTEGER DEFAULT 18,
    total_supply DECIMAL(30,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 2: VESTING SCHEDULES
-- -----------------------------------------------------------------------------

CREATE TABLE vesting_schedules (
    schedule_id SERIAL PRIMARY KEY,
    schedule_name VARCHAR(200) NOT NULL,
    beneficiary_type VARCHAR(50) CHECK (beneficiary_type IN ('founder', 'team', 'advisor', 'backer', 'partner', 'employee', 'dao')),
    cliff_months INTEGER NOT NULL,
    vesting_months INTEGER NOT NULL,
    vesting_interval VARCHAR(20) CHECK (vesting_interval IN ('daily', 'weekly', 'monthly', 'quarterly')),
    immediate_unlock_percentage DECIMAL(5,2) DEFAULT 0,
    is_revokable BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vesting_agreements (
    agreement_id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES vesting_schedules(schedule_id),
    beneficiary_wallet VARCHAR(100) NOT NULL,
    beneficiary_type VARCHAR(50),
    total_tokens DECIMAL(30,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE GENERATED ALWAYS AS (start_date + (vesting_months || ' months')::interval) STORED,
    status VARCHAR(20) CHECK (status IN ('pending', 'active', 'completed', 'revoked', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(beneficiary_wallet, schedule_id)
);

CREATE TABLE vesting_events (
    event_id SERIAL PRIMARY KEY,
    agreement_id INTEGER REFERENCES vesting_agreements(agreement_id),
    event_type VARCHAR(50) CHECK (event_type IN ('grant', 'unlock', 'claim', 'revoke', 'transfer')),
    tokens DECIMAL(30,2) NOT NULL,
    transaction_hash VARCHAR(100),
    block_number BIGINT,
    event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- -----------------------------------------------------------------------------
-- SECTION 3: TOKEN HOLDINGS & TRANSFERS
-- -----------------------------------------------------------------------------

CREATE TABLE token_holdings (
    holding_id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(100) NOT NULL,
    token_id INTEGER REFERENCES token_registry(token_id),
    balance DECIMAL(30,2) DEFAULT 0,
    locked_balance DECIMAL(30,2) DEFAULT 0,
    available_balance DECIMAL(30,2) GENERATED ALWAYS AS (balance - locked_balance) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, token_id)
);

CREATE TABLE token_transfers (
    transfer_id SERIAL PRIMARY KEY,
    token_id INTEGER REFERENCES token_registry(token_id),
    from_wallet VARCHAR(100),
    to_wallet VARCHAR(100) NOT NULL,
    amount DECIMAL(30,2) NOT NULL,
    transfer_type VARCHAR(50) CHECK (transfer_type IN ('transfer', 'mint', 'burn', 'stake', 'unstake', 'reward', 'grant', 'refund')),
    transaction_hash VARCHAR(100) UNIQUE,
    block_number BIGINT,
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'failed')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 4: STAKING
-- -----------------------------------------------------------------------------

CREATE TABLE staking_pools (
    pool_id SERIAL PRIMARY KEY,
    pool_name VARCHAR(200) NOT NULL,
    token_id INTEGER REFERENCES token_registry(token_id),
    reward_token_id INTEGER REFERENCES token_registry(token_id),
    reward_rate_annual DECIMAL(10,4),
    min_stake DECIMAL(30,2),
    max_stake DECIMAL(30,2),
    lock_period_days INTEGER,
    early_withdrawal_penalty DECIMAL(5,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staking_positions (
    position_id SERIAL PRIMARY KEY,
    pool_id INTEGER REFERENCES staking_pools(pool_id),
    wallet_address VARCHAR(100) NOT NULL,
    staked_amount DECIMAL(30,2) NOT NULL,
    rewards_earned DECIMAL(30,2) DEFAULT 0,
    rewards_claimed DECIMAL(30,2) DEFAULT 0,
    stake_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unlock_date TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('active', 'unlocking', 'withdrawn')),
    UNIQUE(pool_id, wallet_address)
);

CREATE TABLE staking_rewards (
    reward_id SERIAL PRIMARY KEY,
    position_id INTEGER REFERENCES staking_positions(position_id),
    reward_amount DECIMAL(30,2) NOT NULL,
    reward_period_start DATE,
    reward_period_end DATE,
    claim_transaction_hash VARCHAR(100),
    claimed_at TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('accrued', 'claimed', 'forfeited'))
);

-- -----------------------------------------------------------------------------
-- SECTION 5: DELEGATION
-- -----------------------------------------------------------------------------

CREATE TABLE delegation_records (
    delegation_id SERIAL PRIMARY KEY,
    delegator_wallet VARCHAR(100) NOT NULL,
    delegate_wallet VARCHAR(100) NOT NULL,
    token_id INTEGER REFERENCES token_registry(token_id),
    delegated_amount DECIMAL(30,2) NOT NULL,
    delegation_type VARCHAR(50) CHECK (delegation_type IN ('voting', 'staking', 'general')),
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    UNIQUE(delegator_wallet, delegate_wallet, token_id, delegation_type)
);

-- -----------------------------------------------------------------------------
-- SECTION 6: SNAPSHOTS & CLAIMS
-- -----------------------------------------------------------------------------

CREATE TABLE token_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    snapshot_type VARCHAR(50) CHECK (snapshot_type IN ('dividend', 'governance', 'airdrop', 'reward')),
    snapshot_date TIMESTAMP NOT NULL,
    total_supply_at_snapshot DECIMAL(30,2),
    holder_count INTEGER,
    block_number BIGINT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE snapshot_holdings (
    holding_id SERIAL PRIMARY KEY,
    snapshot_id INTEGER REFERENCES token_snapshots(snapshot_id),
    wallet_address VARCHAR(100) NOT NULL,
    token_id INTEGER REFERENCES token_registry(token_id),
    balance_at_snapshot DECIMAL(30,2) NOT NULL,
    UNIQUE(snapshot_id, wallet_address, token_id)
);

CREATE TABLE dividend_claims (
    claim_id SERIAL PRIMARY KEY,
    snapshot_id INTEGER REFERENCES token_snapshots(snapshot_id),
    wallet_address VARCHAR(100) NOT NULL,
    eligible_amount DECIMAL(30,2) NOT NULL,
    claimed_amount DECIMAL(30,2) DEFAULT 0,
    claim_status VARCHAR(20) CHECK (claim_status IN ('eligible', 'claimed', 'expired')),
    claimed_at TIMESTAMP,
    transaction_hash VARCHAR(100),
    UNIQUE(snapshot_id, wallet_address)
);

-- -----------------------------------------------------------------------------
-- SECTION 7: GOVERNANCE TOKEN SPECIAL
-- -----------------------------------------------------------------------------

CREATE TABLE governance_token_special (
    special_id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(100) NOT NULL,
    token_id INTEGER REFERENCES token_registry(token_id),
    voting_power_boost DECIMAL(5,4) DEFAULT 1.0000,
    proposal_rights BOOLEAN DEFAULT FALSE,
    committee_eligible BOOLEAN DEFAULT FALSE,
    veto_power BOOLEAN DEFAULT FALSE,
    reputation_boost DECIMAL(10,2) DEFAULT 0,
    valid_from DATE,
    valid_until DATE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(100),
    UNIQUE(wallet_address, token_id)
);

-- -----------------------------------------------------------------------------
-- SECTION 8: REPORTS & ANALYTICS
-- -----------------------------------------------------------------------------

CREATE VIEW v_token_holders_summary AS
SELECT 
    t.token_symbol,
    COUNT(DISTINCT th.wallet_address) as holder_count,
    SUM(th.balance) as total_held,
    SUM(th.locked_balance) as total_locked,
    SUM(th.available_balance) as total_available
FROM token_holdings th
JOIN token_registry t ON th.token_id = t.token_id
GROUP BY t.token_id, t.token_symbol;

CREATE VIEW v_vesting_status AS
SELECT 
    va.beneficiary_wallet,
    va.status,
    vs.schedule_name,
    vs.beneficiary_type,
    va.total_tokens,
    va.start_date,
    va.end_date,
    COALESCE(SUM(ve.tokens), 0) as claimed_tokens,
    va.total_tokens - COALESCE(SUM(ve.tokens), 0) as remaining_tokens
FROM vesting_agreements va
JOIN vesting_schedules vs ON va.schedule_id = vs.schedule_id
LEFT JOIN vesting_events ve ON va.agreement_id = ve.agreement_id AND ve.event_type = 'claim'
GROUP BY va.agreement_id, va.beneficiary_wallet, va.status, vs.schedule_name, 
         vs.beneficiary_type, va.total_tokens, va.start_date, va.end_date;

CREATE VIEW v_staking_pool_stats AS
SELECT 
    sp.pool_name,
    t.token_symbol as stake_token,
    rt.token_symbol as reward_token,
    COUNT(DISTINCT sp2.wallet_address) as staker_count,
    SUM(sp2.staked_amount) as total_staked,
    SUM(sp2.rewards_earned) as total_rewards,
    sp.reward_rate_annual,
    sp.is_active
FROM staking_pools sp
JOIN token_registry t ON sp.token_id = t.token_id
JOIN token_registry rt ON sp.reward_token_id = rt.token_id
LEFT JOIN staking_positions sp2 ON sp.pool_id = sp2.pool_id AND sp2.status = 'active'
GROUP BY sp.pool_id, sp.pool_name, t.token_symbol, rt.token_symbol, 
         sp.reward_rate_annual, sp.is_active;

CREATE VIEW v_dividend_distribution AS
SELECT 
    ts.snapshot_type,
    ts.snapshot_date,
    ts.total_supply_at_snapshot,
    ts.holder_count,
    COUNT(DISTINCT dc.wallet_address) as claimants,
    SUM(dc.eligible_amount) as total_distributed,
    SUM(dc.claimed_amount) as total_claimed,
    CASE 
        WHEN SUM(dc.eligible_amount) > 0 
        THEN (SUM(dc.claimed_amount) / SUM(dc.eligible_amount)) * 100 
        ELSE 0 
    END as claim_percentage
FROM token_snapshots ts
LEFT JOIN dividend_claims dc ON ts.snapshot_id = dc.snapshot_id
GROUP BY ts.snapshot_id, ts.snapshot_type, ts.snapshot_date, 
         ts.total_supply_at_snapshot, ts.holder_count;

-- -----------------------------------------------------------------------------
-- SECTION 9: INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_token_holdings_wallet ON token_holdings(wallet_address);
CREATE INDEX idx_token_holdings_token ON token_holdings(token_id);
CREATE INDEX idx_token_transfers_wallet_from ON token_transfers(from_wallet);
CREATE INDEX idx_token_transfers_wallet_to ON token_transfers(to_wallet);
CREATE INDEX idx_token_transfers_token ON token_transfers(token_id);
CREATE INDEX idx_staking_positions_wallet ON staking_positions(wallet_address);
CREATE INDEX idx_staking_positions_pool ON staking_positions(pool_id);
CREATE INDEX idx_vesting_agreements_wallet ON vesting_agreements(beneficiary_wallet);
CREATE INDEX idx_delegation_delegator ON delegation_records(delegator_wallet);
CREATE INDEX idx_delegation_delegate ON delegation_records(delegate_wallet);
CREATE INDEX idx_snapshot_holdings_wallet ON snapshot_holdings(wallet_address);
CREATE INDEX idx_dividend_claims_wallet ON dividend_claims(wallet_address);

-- =============================================================================
-- END OF TOKEN & VESTING SCHEMA (MODULE 11)
-- =============================================================================
