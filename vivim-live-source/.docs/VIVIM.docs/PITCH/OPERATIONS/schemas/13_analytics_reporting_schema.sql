-- =============================================================================
-- VIVIM Digital Twin - Analytics & Reporting Schema (Module 13)
-- =============================================================================
-- Metrics, analytics, reporting, dashboards, and business intelligence
-- Cross-module analytics for comprehensive insights
-- =============================================================================

-- -----------------------------------------------------------------------------
-- SECTION 1: KEY METRICS DEFINITIONS
-- -----------------------------------------------------------------------------

CREATE TABLE metric_definitions (
    metric_id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_code VARCHAR(50) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    
    calculation_method TEXT,
    aggregation_type VARCHAR(50),
    unit VARCHAR(20),
    
    target_value DECIMAL(15,4),
    warning_threshold DECIMAL(15,4),
    critical_threshold DECIMAL(15,4),
    
    data_source VARCHAR(100),
    refresh_frequency VARCHAR(20),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 2: DAILY METRICS AGGREGATION
-- -----------------------------------------------------------------------------

CREATE TABLE daily_metrics (
    metric_id INTEGER REFERENCES metric_definitions(metric_id),
    record_date DATE NOT NULL,
    value DECIMAL(20,6),
    previous_value DECIMAL(20,6),
    change_percentage DECIMAL(10,4),
    
    metadata JSONB,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (metric_id, record_date)
);

CREATE TABLE hourly_metrics (
    metric_id INTEGER REFERENCES metric_definitions(metric_id),
    record_timestamp TIMESTAMP NOT NULL,
    value DECIMAL(20,6),
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (metric_id, record_timestamp)
);

-- -----------------------------------------------------------------------------
-- SECTION 3: USER METRICS
-- -----------------------------------------------------------------------------

CREATE TABLE user_metrics_daily (
    record_date DATE PRIMARY KEY,
    
    total_registered_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users_dau INTEGER DEFAULT 0,
    active_users_wau INTEGER DEFAULT 0,
    active_users_mau INTEGER DEFAULT 0,
    
    dau_mau_ratio DECIMAL(8,4),
    wau_mau_ratio DECIMAL(8,4),
    
    users_with_subscriptions INTEGER DEFAULT 0,
    users_with_api_access INTEGER DEFAULT 0,
    
    churned_users INTEGER DEFAULT 0,
    churn_rate DECIMAL(8,4),
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_cohorts (
    cohort_id SERIAL PRIMARY KEY,
    cohort_date DATE NOT NULL,
    cohort_size INTEGER NOT NULL,
    
    retained_users_1d INTEGER DEFAULT 0,
    retained_users_7d INTEGER DEFAULT 0,
    retained_users_14d INTEGER DEFAULT 0,
    retained_users_30d INTEGER DEFAULT 0,
    retained_users_60d INTEGER DEFAULT 0,
    retained_users_90d INTEGER DEFAULT 0,
    
    retention_1d DECIMAL(8,4),
    retention_7d DECIMAL(8,4),
    retention_14d DECIMAL(8,4),
    retention_30d DECIMAL(8,4),
    retention_60d DECIMAL(8,4),
    retention_90d DECIMAL(8,4),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_segments (
    segment_id SERIAL PRIMARY KEY,
    segment_name VARCHAR(100) NOT NULL,
    segment_definition JSONB NOT NULL,
    user_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 4: REVENUE METRICS
-- -----------------------------------------------------------------------------

CREATE TABLE revenue_metrics_daily (
    record_date DATE PRIMARY KEY,
    
    total_revenue DECIMAL(15,2) DEFAULT 0,
    subscription_revenue DECIMAL(15,2) DEFAULT 0,
    api_revenue DECIMAL(15,2) DEFAULT 0,
    enterprise_revenue DECIMAL(15,2) DEFAULT 0,
    partnership_revenue DECIMAL(15,2) DEFAULT 0,
    
    new_mrr DECIMAL(15,2) DEFAULT 0,
    expansion_mrr DECIMAL(15,2) DEFAULT 0,
    churn_mrr DECIMAL(15,2) DEFAULT 0,
    net_new_mrr DECIMAL(15,2) DEFAULT 0,
    
    mrr DECIMAL(15,2) DEFAULT 0,
    arr DECIMAL(15,2) DEFAULT 0,
    ltv DECIMAL(15,2) DEFAULT 0,
    cac DECIMAL(15,2) DEFAULT 0,
    
    arpu DECIMAL(15,2) DEFAULT 0,
    ltv_cac_ratio DECIMAL(10,4),
    
    paid_users INTEGER DEFAULT 0,
    arpa DECIMAL(15,2) DEFAULT 0,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 5: OPERATIONS METRICS
-- -----------------------------------------------------------------------------

CREATE TABLE operations_metrics_daily (
    record_date DATE PRIMARY KEY,
    
    total_compute_hours DECIMAL(15,2) DEFAULT 0,
    total_storage_gb DECIMAL(15,2) DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    
    compute_cost DECIMAL(15,2) DEFAULT 0,
    storage_cost DECIMAL(15,2) DEFAULT 0,
    api_cost DECIMAL(15,2) DEFAULT 0,
    total_infrastructure_cost DECIMAL(15,2) DEFAULT 0,
    
    cost_per_user DECIMAL(10,4),
    cost_per_api_call DECIMAL(10,6),
    
    uptime_percentage DECIMAL(6,4),
    incident_count INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    
    active_bounties INTEGER DEFAULT 0,
    completed_bounties INTEGER DEFAULT 0,
    bounty_payout_total DECIMAL(15,2) DEFAULT 0,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 6: COMMUNITY METRICS
-- -----------------------------------------------------------------------------

CREATE TABLE community_metrics_daily (
    record_date DATE PRIMARY KEY,
    
    total_members INTEGER DEFAULT 0,
    new_members INTEGER DEFAULT 0,
    active_members INTEGER DEFAULT 0,
    
    discord_members INTEGER DEFAULT 0,
    forum_posts INTEGER DEFAULT 0,
    github_contributors INTEGER DEFAULT 0,
    
    proposal_count INTEGER DEFAULT 0,
    proposal_approved INTEGER DEFAULT 0,
    proposal_rejected INTEGER DEFAULT 0,
    voter_participation_rate DECIMAL(8,4),
    
    total_reputation_points DECIMAL(15,2) DEFAULT 0,
    top_contributors_count INTEGER DEFAULT 0,
    
    support_tickets INTEGER DEFAULT 0,
    support_resolution_time_hours DECIMAL(10,2),
    satisfaction_score DECIMAL(5,2),
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 7: GOVERNANCE METRICS
-- -----------------------------------------------------------------------------

CREATE TABLE governance_metrics_daily (
    record_date DATE PRIMARY KEY,
    
    total_token_holders INTEGER DEFAULT 0,
    active_voters INTEGER DEFAULT 0,
    delegated_votes DECIMAL(15,2) DEFAULT 0,
    
    proposals_created INTEGER DEFAULT 0,
    proposals_voting INTEGER DEFAULT 0,
    proposals_executed INTEGER DEFAULT 0,
    proposals_failed INTEGER DEFAULT 0,
    
    avg_voter_turnout DECIMAL(8,4),
    avg_proposal_duration_days DECIMAL(5,2),
    
    treasury_balance DECIMAL(20,2) DEFAULT 0,
    treasury_inflow DECIMAL(15,2) DEFAULT 0,
    treasury_outflow DECIMAL(15,2) DEFAULT 0,
    
    dividend_distributed DECIMAL(15,2) DEFAULT 0,
    dividend_recipients INTEGER DEFAULT 0,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 8: AI AGENT METRICS
-- -----------------------------------------------------------------------------

CREATE TABLE ai_agent_metrics_daily (
    record_date DATE PRIMARY KEY,
    
    active_agents INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    
    llm_api_calls INTEGER DEFAULT 0,
    llm_tokens_used INTEGER DEFAULT 0,
    llm_cost DECIMAL(15,2) DEFAULT 0,
    
    automation_tasks INTEGER DEFAULT 0,
    workflow_executions INTEGER DEFAULT 0,
    success_rate DECIMAL(6,4),
    
    avg_response_time_ms INTEGER DEFAULT 0,
    error_rate DECIMAL(6,4),
    
    knowledge_queries INTEGER DEFAULT 0,
    knowledge_context_used INTEGER DEFAULT 0,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 9: REPORT SCHEDULES
-- -----------------------------------------------------------------------------

CREATE TABLE report_schedules (
    schedule_id SERIAL PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    description TEXT,
    
    metric_ids INTEGER[],
    filters JSONB,
    
    schedule_cron VARCHAR(50),
    recipients JSONB,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE generated_reports (
    report_id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES report_schedules(schedule_id),
    report_name VARCHAR(100),
    report_data JSONB,
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_to JSONB,
    status VARCHAR(20) DEFAULT 'generated'
);

-- -----------------------------------------------------------------------------
-- SECTION 10: DASHBOARD CONFIGURATIONS
-- -----------------------------------------------------------------------------

CREATE TABLE dashboard_configs (
    dashboard_id SERIAL PRIMARY KEY,
    dashboard_name VARCHAR(100) NOT NULL,
    dashboard_type VARCHAR(50),
    owner_id INTEGER,
    
    widgets JSONB NOT NULL,
    layout JSONB,
    
    refresh_interval_seconds INTEGER DEFAULT 300,
    is_public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 11: TRENDS & FORECASTS
-- -----------------------------------------------------------------------------

CREATE TABLE metric_trends (
    trend_id SERIAL PRIMARY KEY,
    metric_id INTEGER REFERENCES metric_definitions(metric_id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    actual_value DECIMAL(20,6),
    predicted_value DECIMAL(20,6),
    forecast_value DECIMAL(20,6),
    confidence_level DECIMAL(5,4),
    
    trend_direction VARCHAR(20),
    trend_percentage DECIMAL(10,4),
    
    model_used VARCHAR(50),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 12: ALERTS
-- -----------------------------------------------------------------------------

CREATE TABLE metric_alerts (
    alert_id SERIAL PRIMARY KEY,
    metric_id INTEGER REFERENCES metric_definitions(metric_id),
    alert_type VARCHAR(50) CHECK (alert_type IN ('threshold', 'anomaly', 'trend', 'forecast')),
    
    threshold_value DECIMAL(20,6),
    comparison_operator VARCHAR(10),
    
    current_value DECIMAL(20,6),
    previous_value DECIMAL(20,6),
    
    status VARCHAR(20) CHECK (status IN ('triggered', 'acknowledged', 'resolved')),
    
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER,
    resolved_at TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- SECTION 13: ANALYTICS VIEWS
-- -----------------------------------------------------------------------------

CREATE VIEW v_user_growth_trajectory AS
SELECT 
    record_date,
    total_registered_users,
    new_users,
    active_users_mau,
    active_users_dau,
    dau_mau_ratio,
    LAG(total_registered_users, 7) OVER (ORDER BY record_date) as users_7d_ago,
    total_registered_users - LAG(total_registered_users, 7) OVER (ORDER BY record_date) as user_growth_7d,
    (total_registered_users - LAG(total_registered_users, 7) OVER (ORDER BY record_date)) * 100.0 / 
        NULLIF(LAG(total_registered_users, 7) OVER (ORDER BY record_date), 0) as growth_rate_7d_pct
FROM user_metrics_daily
ORDER BY record_date DESC;

CREATE VIEW v_revenue_trajectory AS
SELECT 
    record_date,
    total_revenue,
    mrr,
    arr,
    arpu,
    ltv,
    cac,
    ltv_cac_ratio,
    paid_users,
    LAG(total_revenue, 30) OVER (ORDER BY record_date) as revenue_30d_ago,
    total_revenue - LAG(total_revenue, 30) OVER (ORDER BY record_date) as revenue_growth_30d
FROM revenue_metrics_daily
ORDER BY record_date DESC;

CREATE VIEW v_unit_economics_summary AS
SELECT 
    record_date,
    arpu,
    ltv,
    cac,
    ltv_cac_ratio,
    CASE 
        WHEN ltv_cac_ratio >= 3 THEN 'Excellent'
        WHEN ltv_cac_ratio >= 2 THEN 'Good'
        WHEN ltv_cac_ratio >= 1 THEN 'Fair'
        ELSE 'Needs Improvement'
    END as ltv_cac_rating
FROM revenue_metrics_daily
ORDER BY record_date DESC;

CREATE VIEW v_milestone_progress AS
SELECT 
    m.milestone_name,
    m.target_date,
    m.target_users,
    um.total_registered_users,
    m.target_users - um.total_registered_users as users_shortfall,
    CASE 
        WHEN um.total_registered_users >= m.target_users THEN 'Achieved'
        WHEN um.total_registered_users >= m.target_users * 0.8 THEN 'Near'
        WHEN um.total_registered_users >= m.target_users * 0.5 THEN 'In Progress'
        ELSE 'At Risk'
    END as status
FROM milestones m
LEFT JOIN (
    SELECT record_date, total_registered_users 
    FROM user_metrics_daily 
    ORDER BY record_date DESC LIMIT 1
) um ON TRUE;

-- -----------------------------------------------------------------------------
-- SECTION 14: INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_daily_metrics_date ON daily_metrics(record_date);
CREATE INDEX idx_hourly_metrics_timestamp ON hourly_metrics(record_timestamp);
CREATE INDEX idx_user_cohorts_date ON user_cohorts(cohort_date);
CREATE INDEX idx_revenue_metrics_date ON revenue_metrics_daily(record_date);
CREATE INDEX idx_operations_metrics_date ON operations_metrics_daily(record_date);
CREATE INDEX idx_community_metrics_date ON community_metrics_daily(record_date);
CREATE INDEX idx_governance_metrics_date ON governance_metrics_daily(record_date);
CREATE INDEX idx_ai_agent_metrics_date ON ai_agent_metrics_daily(record_date);
CREATE INDEX idx_metric_trends_period ON metric_trends(period_start, period_end);
CREATE INDEX idx_alerts_status ON metric_alerts(status);

-- =============================================================================
-- END OF ANALYTICS & REPORTING SCHEMA (MODULE 13)
-- =============================================================================
