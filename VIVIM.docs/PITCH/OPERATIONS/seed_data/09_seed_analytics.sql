-- =============================================================================
-- VIVIM Digital Twin - Seed Data for Analytics & Reporting (Module 13)
-- =============================================================================

INSERT INTO metric_definitions (metric_name, metric_code, category, description, unit, target_value, data_source, refresh_frequency) VALUES
('Monthly Active Users', 'MAU', 'Users', 'Unique users active in last 30 days', 'users', 100000, 'user_activities', 'daily'),
('Daily Active Users', 'DAU', 'Users', 'Unique users active today', 'users', 10000, 'user_activities', 'hourly'),
('DAU/MAU Ratio', 'DAU_MAU', 'Engagement', 'Stickiness of user engagement', 'ratio', 0.20, 'calculated', 'daily'),
('User Retention D30', 'RET_D30', 'Engagement', 'Users retained after 30 days', 'percentage', 0.40, 'cohort_analysis', 'daily'),
('Monthly Recurring Revenue', 'MRR', 'Revenue', 'Recurring revenue per month', 'EUR', 1000000, 'subscriptions', 'daily'),
('Annual Recurring Revenue', 'ARR', 'Revenue', 'Annualized recurring revenue', 'EUR', 12000000, 'subscriptions', 'daily'),
('Customer Lifetime Value', 'LTV', 'Revenue', 'Average customer lifetime value', 'EUR', 5000, 'calculated', 'daily'),
('Customer Acquisition Cost', 'CAC', 'Revenue', 'Cost to acquire a customer', 'EUR', 500, 'marketing', 'daily'),
('LTV/CAC Ratio', 'LTV_CAC', 'Revenue', 'Efficiency ratio', 'ratio', 3.0, 'calculated', 'daily'),
('Average Revenue Per User', 'ARPU', 'Revenue', 'Average revenue per user', 'EUR', 50, 'calculated', 'daily'),
('Total Token Holders', 'TOKEN_HOLDERS', 'Governance', 'Number of unique token holders', 'wallets', 10000, 'token_ledger', 'daily'),
('Active Voters', 'ACTIVE_VOTERS', 'Governance', 'Wallets that voted this period', 'wallets', 1000, 'dao_votes', 'daily'),
('Treasury Balance', 'TREASURY', 'Governance', 'Total treasury holdings', 'EUR', 5000000, 'treasury', 'daily'),
('Governance Participation', 'GOV_PARTICIPATION', 'Governance', 'Voter turnout percentage', 'percentage', 0.30, 'dao_votes', 'daily'),
('Support Satisfaction', 'CSAT', 'Support', 'Customer satisfaction score', 'score', 4.5, 'support', 'daily'),
('Infrastructure Uptime', 'UPTIME', 'Operations', 'System uptime percentage', 'percentage', 0.999, 'monitoring', 'hourly'),
('API Response Time', 'API_LATENCY', 'Operations', 'Average API response time', 'ms', 200, 'monitoring', 'hourly'),
('LLM Cost Per User', 'LLM_COST_USER', 'Operations', 'LLM costs per active user', 'EUR', 0.10, 'infrastructure', 'daily');

INSERT INTO user_metrics_daily (record_date, total_registered_users, new_users, active_users_dau, active_users_wau, active_users_mau, users_with_subscriptions, churned_users) VALUES
('2026-01-01', 100, 100, 50, 80, 100, 5, 0),
('2026-01-15', 500, 100, 200, 350, 500, 25, 5),
('2026-02-01', 1500, 250, 500, 1000, 1500, 75, 10),
('2026-02-15', 3500, 400, 1200, 2100, 3500, 175, 20),
('2026-03-01', 7500, 800, 2500, 4500, 7500, 375, 40),
('2026-03-15', 15000, 1500, 5000, 9000, 15000, 750, 80),
('2026-04-01', 25000, 2500, 8000, 15000, 25000, 1250, 150),
('2026-05-01', 40000, 5000, 12000, 24000, 40000, 2000, 250),
('2026-06-01', 60000, 8000, 18000, 36000, 60000, 3000, 400),
('2026-07-01', 85000, 10000, 25000, 51000, 85000, 4250, 500),
('2026-08-01', 110000, 12000, 33000, 66000, 110000, 5500, 600),
('2026-09-01', 135000, 13000, 40000, 81000, 135000, 6750, 700),
('2026-10-01', 160000, 15000, 48000, 96000, 160000, 8000, 800),
('2026-11-01', 185000, 16000, 55000, 111000, 185000, 9250, 900),
('2026-12-01', 210000, 17000, 63000, 126000, 210000, 10500, 1000),
('2027-01-01', 235000, 18000, 70000, 141000, 235000, 11750, 1100);

INSERT INTO revenue_metrics_daily (record_date, total_revenue, subscription_revenue, mrr, arr, ltv, cac, paid_users) VALUES
('2026-01-01', 1000, 500, 1000, 12000, 1000, 500, 5),
('2026-02-01', 8000, 4000, 8000, 96000, 1500, 450, 25),
('2026-03-01', 25000, 12500, 25000, 300000, 2000, 400, 75),
('2026-04-01', 50000, 25000, 50000, 600000, 2500, 350, 175),
('2026-05-01', 100000, 50000, 100000, 1200000, 3000, 300, 375),
('2026-06-01', 175000, 87500, 175000, 2100000, 3500, 275, 750),
('2026-07-01', 275000, 137500, 275000, 3300000, 4000, 250, 1250),
('2026-08-01', 400000, 200000, 400000, 4800000, 4500, 225, 1750),
('2026-09-01', 550000, 275000, 550000, 6600000, 5000, 200, 2500),
('2026-10-01', 725000, 362500, 725000, 8700000, 5500, 180, 3250),
('2026-11-01', 925000, 462500, 925000, 11100000, 6000, 165, 4000),
('2026-12-01', 1150000, 575000, 1150000, 13800000, 6500, 150, 4750),
('2027-01-01', 1400000, 700000, 1400000, 16800000, 7000, 140, 5500);

INSERT INTO operations_metrics_daily (record_date, total_compute_hours, total_api_calls, compute_cost, total_infrastructure_cost, uptime_percentage, active_bounties, completed_bounties, bounty_payout_total) VALUES
('2026-01-01', 100, 10000, 500, 800, 99.90, 5, 2, 1500),
('2026-02-01', 500, 50000, 2000, 3200, 99.95, 15, 10, 7500),
('2026-03-01', 2000, 200000, 8000, 12800, 99.90, 40, 30, 22500),
('2026-04-01', 5000, 500000, 20000, 32000, 99.92, 80, 60, 45000),
('2026-05-01', 10000, 1000000, 40000, 64000, 99.95, 120, 100, 75000),
('2026-06-01', 18000, 1800000, 72000, 115200, 99.90, 150, 120, 90000),
('2026-07-01', 28000, 2800000, 112000, 179200, 99.93, 200, 160, 120000),
('2026-08-01', 40000, 4000000, 160000, 256000, 99.95, 250, 200, 150000),
('2026-09-01', 55000, 5500000, 220000, 352000, 99.92, 300, 240, 180000),
('2026-10-01', 75000, 7500000, 300000, 480000, 99.94, 350, 280, 210000),
('2026-11-01', 100000, 10000000, 400000, 640000, 99.95, 400, 320, 240000),
('2026-12-01', 130000, 13000000, 520000, 832000, 99.93, 450, 360, 270000),
('2027-01-01', 165000, 16500000, 660000, 1056000, 99.96, 500, 400, 300000);
