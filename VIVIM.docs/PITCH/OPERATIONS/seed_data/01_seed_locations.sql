-- VIVIM Digital Twin Cost Database
-- Seed Data: Locations (from VIVIM-Labor-Costs-Mediterranean.md)
-- Version: 1.0.0

-- ============================================================================
-- MEDITERRANEAN LOCATIONS
-- ============================================================================

INSERT INTO locations (
    code, name, country_code, country_name, region, city, timezone, currency_code,
    cost_of_living_index, tech_hub_status, language_primary, language_secondary,
    remote_work_prevalence, tax_corporate_rate, tax_employer_burden, gdpr_compliance,
    data_center_regions, hiring_difficulty_score, quality_of_tech_talent_score, notes
) VALUES
-- MALLORCA, SPAIN
('ES-PM', 'Palma de Mallorca', 'ES', 'Spain', 'Balearic Islands', 'Palma', 'Europe/Madrid', 'EUR',
 85.00, 'growing', 'Spanish', ARRAY['English', 'Catalan'],
 0.75, 25.00, 32.00, true,
 ARRAY['eu-south-1', 'eu-west-3'], 6, 7, 
 'Growing startup scene, lower cost than mainland Spain (~15% below Madrid/Barcelona)'),

-- SICILY, ITALY
('IT-CT', 'Catania', 'IT', 'Italy', 'Sicily', 'Catania', 'Europe/Rome', 'EUR',
 70.00, 'emerging', 'Italian', ARRAY['English'],
 0.70, 24.00, 35.00, true,
 ARRAY['eu-south-1'], 7, 6,
 'Lowest cost of the three locations. Bonus Sud tax incentives available. Catania has growing IT cluster.'),

('IT-PA', 'Palermo', 'IT', 'Italy', 'Sicily', 'Palermo', 'Europe/Rome', 'EUR',
 68.00, 'emerging', 'Italian', ARRAY['English'],
 0.65, 24.00, 35.00, true,
 ARRAY['eu-south-1'], 7, 6,
 'Capital of Sicily. Emerging tech scene with government incentives.'),

-- MALTA
('MT-VA', 'Valletta', 'MT', 'Malta', 'South', 'Valletta', 'Europe/Malta', 'EUR',
 75.00, 'established', 'English', ARRAY['Maltese', 'Italian'],
 0.85, 5.00, 25.00, true,
 ARRAY['eu-south-1'], 8, 7,
 'Strong fintech and iGaming sector. English widely spoken. Highly Qualified Persons tax scheme (15% cap).'),

('MT-SL', 'Sliema', 'MT', 'Malta', 'Central', 'Sliema', 'Europe/Malta', 'EUR',
 78.00, 'established', 'English', ARRAY['Maltese'],
 0.90, 5.00, 25.00, true,
 ARRAY['eu-south-1'], 8, 7,
 'Major business district with tech companies.'),

-- REFERENCE: US BASELINE
('US-SF', 'San Francisco', 'US', 'United States', 'California', 'San Francisco', 'America/Los_Angeles', 'USD',
 100.00, 'established', 'English', ARRAY['Spanish', 'Chinese'],
 0.60, 21.00, 15.00, false,
 ARRAY['us-west-1', 'us-west-2'], 4, 10,
 'Baseline for cost comparison. Highest salaries but largest talent pool.'),

-- REFERENCE: WESTERN EUROPE
('DE-BE', 'Berlin', 'DE', 'Germany', 'Berlin', 'Berlin', 'Europe/Berlin', 'EUR',
 90.00, 'established', 'German', ARRAY['English'],
 0.80, 30.00, 20.00, true,
 ARRAY['eu-central-1'], 5, 9,
 'Major tech hub with high quality talent.'),

('GB-LN', 'London', 'GB', 'United Kingdom', 'England', 'London', 'Europe/London', 'GBP',
 95.00, 'established', 'English', ARRAY['Polish', 'Bengali'],
 0.75, 25.00, 13.80, true,
 ARRAY['eu-west-2'], 4, 10,
 'Global financial and tech center.');

-- ============================================================================
-- TAX INCENTIVES
-- ============================================================================

INSERT INTO location_tax_incentives (
    location_id, name, incentive_type, description, eligibility_criteria,
    benefit_value, benefit_unit, duration_months, income_threshold_min,
    eligible_roles, is_active
)
SELECT 
    l.id,
    'Highly Qualified Persons (HQP) Scheme',
    'tax_rate_cap',
    'Tax rate capped at 15% for highly qualified persons in ICT, Gaming, Fintech',
    '{"residency_required": true, "qualification_level": "degree_or_expert"}',
    15.00,
    'percentage',
    60,
    45000.00,
    ARRAY['ICT', 'Gaming', 'Fintech', 'Maritime'],
    true
FROM locations l
WHERE l.code IN ('MT-VA', 'MT-SL');

INSERT INTO location_tax_incentives (
    location_id, name, incentive_type, description, eligibility_criteria,
    benefit_value, benefit_unit, duration_months, income_threshold_min,
    eligible_roles, is_active
)
SELECT 
    l.id,
    'Bonus Sud - Southern Italy Tax Incentives',
    'tax_credit',
    'Tax incentives for businesses operating in Southern Italy including Sicily',
    '{"location": "southern_italy", "employment_creation": true}',
    30.00,
    'percentage',
    36,
    0.00,
    ARRAY['All'],
    true
FROM locations l
WHERE l.country_code = 'IT' AND l.region = 'Sicily';

-- ============================================================================
-- EMPLOYMENT COST FACTORS
-- ============================================================================

INSERT INTO employment_cost_factors (
    location_id, employment_type, base_salary_multiplier, employer_tax_rate,
    benefits_cost_percentage, thirteenth_month, fourteenth_month,
    severance_days_per_year, notice_period_days_min, notice_period_days_max,
    office_space_cost_monthly, equipment_cost_annual, software_licenses_monthly,
    training_budget_annual, effective_date
)
SELECT 
    l.id,
    'full_time',
    1.00,
    32.00,
    10.00,
    false,
    false,
    20.00,
    15,
    30,
    300.00,
    2000.00,
    150.00,
    1500.00,
    '2025-01-01'
FROM locations l
WHERE l.code = 'ES-PM';

INSERT INTO employment_cost_factors (
    location_id, employment_type, base_salary_multiplier, employer_tax_rate,
    benefits_cost_percentage, thirteenth_month, fourteenth_month,
    severance_days_per_year, notice_period_days_min, notice_period_days_max,
    office_space_cost_monthly, equipment_cost_annual, software_licenses_monthly,
    training_budget_annual, effective_date
)
SELECT 
    l.id,
    'full_time',
    1.00,
    35.00,
    12.00,
    true,
    true,
    30.00,
    15,
    30,
    250.00,
    2000.00,
    150.00,
    1200.00,
    '2025-01-01'
FROM locations l
WHERE l.country_code = 'IT';

INSERT INTO employment_cost_factors (
    location_id, employment_type, base_salary_multiplier, employer_tax_rate,
    benefits_cost_percentage, thirteenth_month, fourteenth_month,
    severance_days_per_year, notice_period_days_min, notice_period_days_max,
    office_space_cost_monthly, equipment_cost_annual, software_licenses_monthly,
    training_budget_annual, effective_date
)
SELECT 
    l.id,
    'full_time',
    1.00,
    25.00,
    8.00,
    false,
    false,
    14.00,
    15,
    30,
    350.00,
    2000.00,
    150.00,
    1800.00,
    '2025-01-01'
FROM locations l
WHERE l.code IN ('MT-VA', 'MT-SL');

-- Contractor factors
INSERT INTO employment_cost_factors (
    location_id, employment_type, base_salary_multiplier,
    platform_fee_percentage, contractor_insurance_min,
    office_space_cost_monthly, equipment_cost_annual, software_licenses_monthly,
    effective_date
)
SELECT 
    l.id,
    'contractor',
    1.25,
    10.00,
    500.00,
    0.00,
    0.00,
    0.00,
    '2025-01-01'
FROM locations l
WHERE l.code IN ('ES-PM', 'IT-CT', 'IT-PA', 'MT-VA', 'MT-SL');
