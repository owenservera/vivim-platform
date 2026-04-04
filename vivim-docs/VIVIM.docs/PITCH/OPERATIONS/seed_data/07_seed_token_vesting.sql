-- =============================================================================
-- VIVIM Digital Twin - Seed Data for Token & Vesting (Module 11)
-- =============================================================================

INSERT INTO token_registry (token_symbol, token_name, token_type, decimals, total_supply, is_active) VALUES
('VGT', 'VIVIM Governance Token', 'governance', 18, 100000000, TRUE),
('VWT', 'VIVIM Work Token', 'work', 18, NULL, TRUE);

INSERT INTO vesting_schedules (schedule_name, beneficiary_type, cliff_months, vesting_months, vesting_interval, immediate_unlock_percentage, description) VALUES
('Founders 4-Year', 'founder', 12, 48, 'monthly', 0, 'Standard founder vesting with 1-year cliff'),
('Team 3-Year', 'team', 12, 36, 'monthly', 0, 'Core team vesting with 1-year cliff'),
('Advisors 2-Year', 'advisor', 6, 24, 'monthly', 10, 'Advisor vesting with 6-month cliff'),
('Backers 2-Year', 'backer', 6, 24, 'monthly', 15, 'Early backer vesting with 6-month cliff'),
('Partners 1-Year', 'partner', 3, 12, 'monthly', 20, 'Partner vesting with 3-month cliff'),
('Employee 3-Year', 'employee', 12, 36, 'monthly', 0, 'Employee standard vesting'),
('DAO Reserve', 'dao', 0, 48, 'quarterly', 0, 'DAO treasury reserve');

INSERT INTO staking_pools (pool_name, reward_rate_annual, min_stake, max_stake, lock_period_days, early_withdrawal_penalty, is_active) VALUES
('Governance Staking', 0.15, 100, 1000000, 30, 5.00, TRUE),
('Liquidity Staking', 0.25, 1000, 5000000, 90, 10.00, TRUE),
('Community Staking', 0.10, 10, 100000, 7, 2.00, TRUE);

INSERT INTO token_holdings (wallet_address, token_id, balance, locked_balance) VALUES
('0xFounders1', 1, 5000000, 5000000),
('0xFounders2', 1, 5000000, 5000000),
('0xFounders3', 1, 5000000, 5000000),
('0xBacker1', 1, 3000000, 2250000),
('0xBacker2', 1, 2000000, 1500000),
('0xBacker3', 1, 2000000, 1500000),
('0xBacker4', 1, 1500000, 1125000),
('0xBacker5', 1, 1500000, 1125000),
('0xTreasury', 1, 40000000, 0),
('0xDAOReserve', 1, 10000000, 0),
('0xCommunity', 1, 15000000, 0),
('0xEarlyUser1', 1, 1000, 0),
('0xEarlyUser2', 1, 2500, 0),
('0xEarlyUser3', 1, 500, 0),
('0xContributor1', 2, 500, 0),
('0xContributor2', 2, 1200, 0),
('0xContributor3', 2, 800, 0);

INSERT INTO governance_token_special (wallet_address, token_id, voting_power_boost, proposal_rights, committee_eligible, reputation_boost, valid_from, reason) VALUES
('0xFounders1', 1, 1.5000, TRUE, TRUE, 10000, '2026-01-01', 'Founding member'),
('0xFounders2', 1, 1.5000, TRUE, TRUE, 10000, '2026-01-01', 'Founding member'),
('0xFounders3', 1, 1.5000, TRUE, TRUE, 10000, '2026-01-01', 'Founding member');
