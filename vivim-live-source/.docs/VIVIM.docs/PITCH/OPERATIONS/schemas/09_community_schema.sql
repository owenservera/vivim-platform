-- VIVIM Digital Twin Cost Database Schema
-- Module: COMMUNITY (Social Features, Reputation, Discussions)
-- Part of the Production Digital Twin - Social Layer & Community Engagement
-- Version: 2.0.0

-- ============================================================================
-- USER PROFILES & SOCIAL IDENTITY
-- ============================================================================

CREATE TABLE community_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL, -- Link to users/employees/DAO members
    
    -- Display
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    
    -- Social presence
    website_url TEXT,
    twitter_handle VARCHAR(50),
    github_username VARCHAR(50),
    linkedin_url TEXT,
    
    -- Expertise & interests
    expertise_areas TEXT ARRAY,
    interests TEXT ARRAY,
    skills_showcase UUID ARRAY, -- References to skills
    
    -- VIVIM-specific
    contributor_since TIMESTAMP WITH TIME ZONE,
    is_core_team BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    
    -- Stats
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    contributions_count INTEGER DEFAULT 0,
    
    -- Visibility
    profile_visibility VARCHAR(50) DEFAULT 'public', -- 'public', 'community', 'private'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE community_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(follower_id, following_id)
);

-- ============================================================================
-- CONTRIBUTIONS & ACTIVITY TRACKING
-- ============================================================================

CREATE TABLE community_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(100) NOT NULL, -- 'code_commit', 'wiki_edit', 'task_completed', 'proposal_vote', 'discussion_post', 'bounty_completed'
    activity_subtype VARCHAR(100), -- More specific categorization
    
    -- Source reference
    source_type VARCHAR(50), -- 'github', 'wiki', 'work', 'dao', 'community'
    source_id UUID, -- Reference to the actual object
    source_url TEXT,
    
    -- Content
    title TEXT,
    description TEXT,
    metadata JSONB, -- Activity-specific data
    
    -- Impact
    impact_score DECIMAL(6,2) DEFAULT 0.00, -- Calculated impact of this activity
    
    -- Visibility
    is_public BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE community_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    
    -- Contribution categorization
    contribution_type VARCHAR(100), -- 'code', 'design', 'documentation', 'testing', 'governance', 'community', 'research'
    
    -- What was contributed
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Links
    related_task_id UUID,
    related_proposal_id UUID,
    related_wiki_article_id UUID,
    related_bounty_id UUID,
    
    -- Value
    estimated_value_usd DECIMAL(10,2),
    actual_reward_usd DECIMAL(10,2),
    reward_token_amount DECIMAL(18,8),
    reward_token_symbol VARCHAR(20),
    
    -- Verification
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending_review', -- 'pending_review', 'verified', 'rejected', 'rewarded'
    
    -- Impact metrics
    impact_score DECIMAL(6,2),
    community_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REPUTATION SYSTEM
-- ============================================================================

CREATE TABLE reputation_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    
    -- Scoring period
    period_start DATE,
    period_end DATE,
    period_type VARCHAR(20), -- 'weekly', 'monthly', 'quarterly', 'all_time'
    
    -- Reputation dimensions
    technical_score DECIMAL(8,2) DEFAULT 0.00, -- Code quality, reviews, architecture
    collaboration_score DECIMAL(8,2) DEFAULT 0.00, -- Helping others, mentoring, communication
    consistency_score DECIMAL(8,2) DEFAULT 0.00, -- Regular contributions over time
    impact_score DECIMAL(8,2) DEFAULT 0.00, -- Size/scope of contributions
    governance_score DECIMAL(8,2) DEFAULT 0.00, -- DAO participation, voting, proposals
    
    -- Overall reputation
    overall_score DECIMAL(8,2) GENERATED ALWAYS AS (
        (technical_score * 0.30) +
        (collaboration_score * 0.25) +
        (consistency_score * 0.20) +
        (impact_score * 0.15) +
        (governance_score * 0.10)
    ) STORED,
    
    -- Rank
    percentile_rank INTEGER, -- 0-100, relative to other contributors
    tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
    
    -- Calculation metadata
    calculation_version INTEGER DEFAULT 1,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reputation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    overall_score DECIMAL(8,2),
    
    -- Change from previous
    score_change DECIMAL(8,2),
    change_reason TEXT ARRAY -- ['completed_major_feature', 'helped_3_new_contributors']
);

CREATE TABLE reputation_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Badge type
    badge_type VARCHAR(50), -- 'achievement', 'skill', 'contribution', 'milestone', 'special'
    rarity VARCHAR(20), -- 'common', 'rare', 'epic', 'legendary'
    
    -- Design
    icon_url TEXT,
    color_hex VARCHAR(7),
    
    -- Criteria
    criteria_type VARCHAR(50), -- 'activity_count', 'score_threshold', 'manual_award', 'event_participation'
    criteria_config JSONB, -- {activity_type: 'code_commit', min_count: 100}
    
    -- Rewards
    reputation_boost DECIMAL(6,2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profile_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES reputation_badges(id),
    
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    awarded_by UUID, -- NULL if automatic
    award_reason TEXT,
    
    UNIQUE(profile_id, badge_id)
);

-- ============================================================================
-- DISCUSSIONS & FORUMS
-- ============================================================================

CREATE TABLE discussion_forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Categorization
    forum_type VARCHAR(100), -- 'general', 'technical', 'governance', 'help', 'showcase'
    
    -- Permissions
    who_can_post VARCHAR(50) ARRAY, -- ['anyone', 'members', 'core_team']
    who_can_view VARCHAR(50) ARRAY,
    
    -- Moderation
    requires_approval BOOLEAN DEFAULT false,
    moderators UUID ARRAY,
    
    -- Stats
    topic_count INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    
    -- Related to other modules
    related_wiki_space_id UUID,
    related_dao_proposal_category_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discussion_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID NOT NULL REFERENCES discussion_forums(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    
    -- Author
    author_id UUID NOT NULL REFERENCES community_profiles(id),
    
    -- Classification
    topic_type VARCHAR(50), -- 'discussion', 'question', 'announcement', 'poll', 'proposal_discussion'
    tags VARCHAR(100) ARRAY,
    
    -- Status
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'solved', 'closed'
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,
    
    -- AI Analysis
    ai_summary TEXT,
    ai_sentiment VARCHAR(20),
    ai_key_points TEXT ARRAY,
    
    -- Related objects
    related_proposal_id UUID,
    related_task_id UUID,
    related_wiki_article_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discussion_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL REFERENCES discussion_topics(id) ON DELETE CASCADE,
    
    parent_post_id UUID REFERENCES discussion_posts(id), -- For threaded replies
    
    -- Content
    content TEXT NOT NULL,
    
    -- Author
    author_id UUID NOT NULL REFERENCES community_profiles(id),
    
    -- Engagement
    upvote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT false, -- For Q&A topics
    
    -- AI Analysis
    ai_sentiment VARCHAR(20),
    ai_contribution_quality VARCHAR(20), -- 'high', 'medium', 'low'
    
    -- Edit history
    edit_count INTEGER DEFAULT 0,
    last_edited_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discussion_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES discussion_posts(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES community_profiles(id),
    
    vote_type VARCHAR(20) NOT NULL, -- 'up', 'down'
    
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(post_id, voter_id)
);

-- ============================================================================
-- REAL-TIME ACTIVITY FEED
-- ============================================================================

CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor
    actor_id UUID REFERENCES community_profiles(id),
    actor_type VARCHAR(20), -- 'user', 'agent', 'system'
    
    -- Action
    verb VARCHAR(100) NOT NULL, -- 'created', 'completed', 'commented', 'voted', 'joined'
    
    -- Target
    target_type VARCHAR(50) NOT NULL, -- 'task', 'proposal', 'article', 'discussion', 'contribution'
    target_id UUID,
    target_title TEXT, -- Denormalized for display
    
    -- Context
    context_type VARCHAR(50), -- 'project', 'milestone', 'forum'
    context_id UUID,
    context_title TEXT,
    
    -- Content preview
    content_preview TEXT,
    
    -- Visibility
    visibility VARCHAR(50) DEFAULT 'public', -- 'public', 'followers', 'private'
    
    -- Aggregation (for grouping similar activities)
    aggregation_group VARCHAR(100),
    aggregation_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_feed_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES community_profiles(id),
    
    -- What to subscribe to
    source_type VARCHAR(50), -- 'user', 'project', 'forum', 'tag'
    source_id UUID,
    
    -- Filter
    activity_types VARCHAR(100) ARRAY, -- ['task_completed', 'proposal_created']
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(subscriber_id, source_type, source_id)
);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES community_profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    notification_type VARCHAR(100), -- 'mention', 'reply', 'vote', 'task_assigned', 'proposal_passed', 'reward_received'
    title VARCHAR(200),
    message TEXT,
    
    -- Source
    source_type VARCHAR(50),
    source_id UUID,
    source_url TEXT,
    
    -- Actions
    action_text VARCHAR(100),
    action_url TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    delivered_via VARCHAR(50) ARRAY, -- ['in_app', 'email', 'push', 'discord']
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COMMUNITY EVENTS & MEETUPS
-- ============================================================================

CREATE TABLE community_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(100), -- 'hackathon', 'workshop', 'ama', 'meetup', 'demo_day'
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(50),
    
    -- Location
    is_virtual BOOLEAN DEFAULT true,
    virtual_link TEXT,
    location_name TEXT,
    location_address TEXT,
    
    -- Organizer
    organizer_id UUID REFERENCES community_profiles(id),
    co_organizers UUID ARRAY,
    
    -- Registration
    max_participants INTEGER,
    registration_required BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
    
    -- Stats
    registered_count INTEGER DEFAULT 0,
    attended_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES community_profiles(id),
    
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attended BOOLEAN,
    
    UNIQUE(event_id, profile_id)
);

-- ============================================================================
-- VIEWS FOR COMMUNITY ANALYTICS
-- ============================================================================

CREATE VIEW v_community_leaderboard AS
SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.contributor_since,
    r.overall_score as reputation_score,
    r.tier,
    COUNT(DISTINCT c.id) as total_contributions,
    SUM(CASE WHEN c.status = 'verified' THEN 1 ELSE 0 END) as verified_contributions,
    SUM(c.actual_reward_usd) as total_rewards_usd,
    p.follower_count
FROM community_profiles p
LEFT JOIN reputation_scores r ON p.id = r.profile_id 
    AND r.period_type = 'all_time'
LEFT JOIN community_contributions c ON p.id = c.profile_id
WHERE p.is_core_team = false -- Focus on community contributors
GROUP BY p.id, p.display_name, p.avatar_url, p.contributor_since, 
         r.overall_score, r.tier, p.follower_count
ORDER BY r.overall_score DESC NULLS LAST;

CREATE VIEW v_discussion_analytics AS
SELECT 
    f.id as forum_id,
    f.name as forum_name,
    COUNT(DISTINCT t.id) as total_topics,
    COUNT(DISTINCT p.id) as total_posts,
    COUNT(DISTINCT p.author_id) as unique_participants,
    AVG(p.upvote_count) as avg_upvotes_per_post,
    MAX(t.created_at) as last_activity_at,
    COUNT(DISTINCT CASE WHEN t.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN t.id END) as topics_this_week
FROM discussion_forums f
LEFT JOIN discussion_topics t ON f.id = t.forum_id
LEFT JOIN discussion_posts p ON t.id = p.topic_id
GROUP BY f.id, f.name;

CREATE VIEW v_activity_feed_public AS
SELECT 
    af.id,
    af.actor_id,
    p.display_name as actor_name,
    p.avatar_url as actor_avatar,
    af.verb,
    af.target_type,
    af.target_id,
    af.target_title,
    af.context_type,
    af.context_title,
    af.content_preview,
    af.aggregation_group,
    af.aggregation_count,
    af.created_at
FROM activity_feed af
JOIN community_profiles p ON af.actor_id = p.id
WHERE af.visibility = 'public'
ORDER BY af.created_at DESC;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_community_profiles_user ON community_profiles(user_id);
CREATE INDEX idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX idx_community_follows_following ON community_follows(following_id);
CREATE INDEX idx_community_activities_profile ON community_activities(profile_id);
CREATE INDEX idx_community_activities_type ON community_activities(activity_type);
CREATE INDEX idx_reputation_scores_profile ON reputation_scores(profile_id);
CREATE INDEX idx_reputation_scores_overall ON reputation_scores(overall_score DESC);
CREATE INDEX idx_discussion_topics_forum ON discussion_topics(forum_id);
CREATE INDEX idx_discussion_topics_author ON discussion_topics(author_id);
CREATE INDEX idx_discussion_posts_topic ON discussion_posts(topic_id);
CREATE INDEX idx_discussion_posts_author ON discussion_posts(author_id);
CREATE INDEX idx_activity_feed_actor ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = false;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE community_profiles IS 'Social profiles for community members';
COMMENT ON TABLE community_contributions IS 'Tracked contributions from community members';
COMMENT ON TABLE reputation_scores IS 'Multi-dimensional reputation scoring';
COMMENT ON TABLE discussion_topics IS 'Forum discussion threads';
COMMENT ON TABLE activity_feed IS 'Real-time activity stream for the community';
COMMENT ON VIEW v_community_leaderboard IS 'Community contributors ranked by reputation';
