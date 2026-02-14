# VIVIM Icon Library - Quick Reference Card

> **Quick lookup guide for developers**  
> **Version:** 1.0 | **Updated:** Feb 9, 2026

---

## Import Pattern

```tsx
// Recommended: Named imports from categories
import { Home, Search, Vault, User } from './icons/navigation';
import { Plus, Edit, Delete, Copy } from './icons/actions';
import { Heart, Fork, Share, Bookmark } from './icons/social';
import { Lock, Shield, Key } from './icons/security';

// Component usage
<Icon name="home-feed" size={24} />
<Icon name="heart-like" filled={false} />
<Icon name="lock-privacy" className="custom" />
```

---

## Navigation Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Feed tab | `home-feed` | `<HomeFeed />` |
| Search tab | `search` | `<Search />` |
| Vault tab | `vault-closed` | `<VaultClosed />` |
| Profile tab | `user-profile` | `<UserProfile />` |
| Go back | `arrow-back` | `<ArrowBack />` |
| Go forward | `arrow-forward` | `<ArrowForward />` |
| Expand menu | `chevron-down` | `<ChevronDown />` |
| Collapse menu | `chevron-up` | `<ChevronUp />` |
| Navigate deeper | `chevron-right` | `<ChevronRight />` |
| Close modal | `close-x` | `<CloseX />` |
| Notifications | `bell-notification` | `<BellNotification />` |
| Settings | `settings-cog` | `<SettingsCog />` |

---

## Action Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Capture URL | `capture-download` | `<CaptureDownload />` |
| Create new | `add-plus` | `<AddPlus />` |
| Edit content | `edit-pencil` | `<EditPencil />` |
| Save changes | `save-floppy` | `<SaveFloppy />` |
| Delete item | `delete-trash` | `<DeleteTrash />` |
| Copy to clipboard | `copy-duplicate` | `<CopyDuplicate />` |
| Fork conversation | `git-fork-branch` | `<GitForkBranch />` |
| Share item | `share-network` | `<ShareNetwork />` |
| Refresh | `refresh-circular` | `<RefreshCircular />` |
| Retry action | `retry-arrow` | `<RetryArrow />` |
| Cancel | `cancel-slash` | `<CancelSlash />` |
| Import | `import-arrow` | `<ImportArrow />` |
| Export | `export-arrow` | `<ExportArrow />` |

---

## Social Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Like ACU | `heart-like` | `<HeartLike />` |
| Liked state | `heart-filled` | `<HeartFilled />` |
| Fork/Remix | `fork-branch` | `<ForkBranch />` |
| Bookmark | `bookmark-ribbon` | `<BookmarkRibbon />` |
| Bookmarked | `bookmark-filled` | `<BookmarkFilled />` |
| Follow user | `user-follow` | `<UserFollow />` |
| Comment | `comment-bubble` | `<CommentBubble />` |
| View | `eye-view` | `<EyeView />` |
| Hide | `eye-closed` | `<EyeClosed />` |
| Copy link | `link-copy` | `<LinkCopy />` |
| QR code | `qr-code` | `<QrCode />` |
| External link | `external-link` | `<ExternalLink />` |

---

## ACU Type Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Question | `acu-question` | `<AcuQuestion />` |
| Answer | `acu-answer` | `<AcuAnswer />` |
| Code snippet | `acu-code` | `<AcuCode />` |
| Statement | `acu-statement` | `<AcuStatement />` |
| Formula | `acu-formula` | `<AcuFormula />` |
| Table | `acu-table` | `<AcuTable />` |
| Image | `acu-image` | `<AcuImage />` |
| Tool call | `acu-tool` | `<AcuTool />` |
| Tool result | `acu-tool-result` | `<AcuToolResult />` |
| Explanation | `acu-explanation` | `<AcuExplanation />` |
| Summary | `acu-summary` | `<AcuSummary />` |

---

## AI Provider Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| OpenAI | `provider-chatgpt` | `<ProviderChatgpt />` |
| Anthropic | `provider-claude` | `<ProviderClaude />` |
| Google | `provider-gemini` | `<ProviderGemini />` |
| xAI | `provider-grok` | `<ProviderGrok />` |
| Generic AI | `ai-generic` | `<AiGeneric />` |

---

## Status Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Loading | `loading-spinner` | `<LoadingSpinner />` |
| Success | `status-success` | `<StatusSuccess />` |
| Error | `status-error` | `<StatusError />` |
| Warning | `status-warning` | `<StatusWarning />` |
| Info | `status-info` | `<StatusInfo />` |
| Verified | `status-verified` | `<StatusVerified />` |
| Pending | `status-pending` | `<StatusPending />` |
| Synced | `sync-synced` | `<SyncSynced />` |
| Syncing | `sync-syncing` | `<SyncSyncing />` |
| Offline | `sync-offline` | `<SyncOffline />` |

---

## Security Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Lock | `lock-closed` | `<LockClosed />` |
| Unlock | `lock-open` | `<LockOpen />` |
| Privacy | `privacy-shield` | `<PrivacyShield />` |
| Encryption | `encryption-key` | `<EncryptionKey />` |
| Security | `security-shield` | `<SecurityShield />` |
| Identity | `identity-did` | `<IdentityDid />` |
| API key | `api-key` | `<ApiKey />` |
| Fingerprint | `fingerprint-scan` | `<FingerprintScan />` |

---

## Settings Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Privacy | `privacy-shield` | `<PrivacyShield />` |
| Security | `security-shield` | `<SecurityShield />` |
| Identity | `identity-card` | `<IdentityCard />` |
| Analytics | `analytics-chart` | `<AnalyticsChart />` |
| Storage | `storage-database` | `<StorageDatabase />` |
| Notifications | `bell-notification` | `<BellNotification />` |
| Appearance | `appearance-palette` | `<AppearancePalette />` |
| Language | `language-globe` | `<LanguageGlobe />` |
| Export | `export-box` | `<ExportBox />` |
| Import | `import-box` | `<ImportBox />` |

---

## Editor Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Bold text | `text-bold` | `<TextBold />` |
| Italic text | `text-italic` | `<TextItalic />` |
| Inline code | `code-inline` | `<CodeInline />` |
| Code block | `code-block` | `<CodeBlock />` |
| Bulleted list | `list-bulleted` | `<ListBulleted />` |
| Numbered list | `list-numbered` | `<ListNumbered />` |
| Blockquote | `text-quote` | `<TextQuote />` |
| Insert link | `editor-link` | `<EditorLink />` |
| Send message | `send-plane` | `<SendPlane />` |
| Attach file | `attach-paperclip` | `<AttachPaperclip />` |
| Clear input | `input-clear` | `<InputClear />` |

---

## File Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Folder | `folder-closed` | `<FolderClosed />` |
| Open folder | `folder-open` | `<FolderOpen />` |
| Add folder | `folder-add` | `<FolderAdd />` |
| Archive | `archive-box` | `<ArchiveBox />` |
| Bookmark | `bookmark-ribbon` | `<BookmarkRibbon />` |
| Document | `doc-generic` | `<DocGeneric />` |
| Image file | `doc-image` | `<DocImage />` |
| Code file | `doc-code` | `<DocCode />` |

---

## Size Reference

```tsx
// XS - 12px
<Icon name="tag-hash" size="xs" />

// SM - 16px
<Icon name="chevron-right" size="sm" />

// MD - 18px (default)
<Icon name="heart-like" />

// LG - 20px
<Icon name="home-feed" size="lg" />

// XL - 24px
<Icon name="settings-cog" size="xl" />

// 2XL - 32px
<Icon name="vault-closed" size="2xl" />

// 3XL - 48px
<Icon name="share-network" size="3xl" />
```

---

## State Variants

```tsx
// Filled variant
<Icon name="heart-like" filled={true} />

// With badge
<Icon name="bell-notification" badge="3" />

// With animation
<Icon name="loading-spinner" animated="spin" />

// Clickable
<Icon name="edit-pencil" onClick={handleEdit} />

// Custom color
<Icon name="status-success" color="green" />

// Custom class
<Icon name="custom-icon" className="my-custom-class" />
```

---

## Icon Props Interface

```typescript
interface IconProps {
  // Core
  name: string;           // Icon identifier
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  
  // Visual states
  filled?: boolean;       // Use filled variant
  color?: string;        // CSS color or hex
  strokeWidth?: number;  // Stroke width override
  
  // States
  disabled?: boolean;
  loading?: boolean;
  
  // Interactivity
  onClick?: () => void;
  ariaLabel?: string;
  
  // Badge/count
  badge?: number | string;
  badgeColor?: string;
  
  // Animation
  animated?: 'spin' | 'pulse' | 'bounce';
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
}
```

---

## Quick Color Mapping

| Icon Type | Default Color | Hover Color | Active Color |
|-----------|---------------|-------------|---------------|
| Navigation | `gray-400` | `gray-600` | `primary-600` |
| Primary Actions | `primary-600` | `primary-700` | `primary-800` |
| Success | `success-500` | `success-600` | `success-700` |
| Error | `error-500` | `error-600` | `error-700` |
| Warning | `warning-500` | `warning-600` | `warning-700` |
| Info | `info-500` | `info-600` | `info-700` |

---

## Accessibility Checklist

- [ ] All icons have `aria-label` or `aria-hidden`
- [ ] Touch targets minimum 44x44px
- [ ] Color contrast minimum 4.5:1
- [ ] Focus states visible on keyboard navigation
- [ ] Screen reader announces icon purpose
- [ ] Animated icons respect `prefers-reduced-motion`
- [ ] Icons work in dark mode

---

## File Structure

```
src/
├── icons/
│   ├── index.ts              # Barrel export
│   ├── navigation/           # Navigation icons
│   │   ├── index.ts
│   │   ├── HomeFeed.tsx
│   │   ├── Search.tsx
│   │   └── ...
│   ├── actions/             # Action icons
│   ├── social/              # Social icons
│   ├── content/            # ACU/Content icons
│   ├── providers/          # AI provider icons
│   ├── status/              # Status icons
│   ├── security/            # Security icons
│   └── ...
├── components/
│   └── Icon/
│       ├── index.ts
│       ├── Icon.tsx         # Main icon component
│       ├── Icon.css
│       └── Icon.stories.tsx # Storybook stories
└── ...
```

---

*For full specification, see `ICON_LIBRARY_SPECIFICATION.md`*

---

## Collaboration Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Fork ACU | `fork-git` | `<ForkGit />` |
| Branch view | `branch-active` | `<BranchActive />` |
| Merge | `merge-arrows` | `<MergeArrows />` |
| Merge conflict | `merge-conflict` | `<MergeConflict />` |
| Provenance | `provenance-chain` | `<ProvenanceChain />` |
| Attribution | `attribution-credit` | `<AttributionCredit />` |
| Original author | `author-original` | `<AuthorOriginal />` |
| Contributor badge | `contributor-badge` | `<ContributorBadge />` |
| Co-author | `co-author` | `<CoAuthor />` |
| Real-time presence | `presence-online` | `<PresenceOnline />` |
| Active collaborators | `users-active` | `<UsersActive />` |
| Typing indicator | `typing-indicator` | `<TypingIndicator />` |
| Edit lock | `edit-lock` | `<EditLock />` |
| Peer review | `review-eye` | `<ReviewEye />` |
| Approve | `review-approve` | `<ReviewApprove />` |
| Request changes | `review-request` | `<ReviewRequest />` |
| Contribution chart | `contribution-chart` | `<ContributionChart />` |
| Activity timeline | `activity-timeline` | `<ActivityTimeline />` |
| Streak | `streak-fire` | `<StreakFire />` |
| Rank trophy | `rank-trophy` | `<RankTrophy />` |

---

## Knowledge Graph Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Graph view | `graph-network` | `<GraphNetwork />` |
| Node | `graph-node` | `<GraphNode />` |
| Edge/connection | `graph-edge` | `<GraphEdge />` |
| Node cluster | `graph-cluster` | `<GraphCluster />` |
| Hub node | `graph-hub` | `<GraphHub />` |
| Directed edge | `graph-edge-directed` | `<GraphEdgeDirected />` |
| VaultSense | `vaultsense-radar` | `<VaultsenseRadar />` |
| Connections | `vaultsense-links` | `<VaultsenseLinks />` |
| AI insights | `vaultsense-insights` | `<VaultsenseInsights />` |
| Suggestions | `vaultsense-suggest` | `<VaultsenseSuggest />` |
| Related content | `vaultsense-related` | `<VaultsenseRelated />` |
| Knowledge path | `vaultsense-path` | `<VaultsensePath />` |
| Semantic distance | `vaultsense-distance` | `<VaultsenseDistance />` |
| Similarity | `vaultsense-similarity` | `<VaultsenseSimilarity />` |
| Discovery | `vaultsense-discovery` | `<VaultsenseDiscovery />` |
| Trending | `vaultsense-trending` | `<VaultsenseTrending />` |
| Graph centraltiy | `graph-centrality` | `<GraphCentrality />` |
| Graph density | `graph-density` | `<GraphDensity />` |
| Graph components | `graph-components` | `<GraphComponents />` |
| Graph paths | `graph-paths` | `<GraphPaths />` |

---

## Personal Knowledgebase Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Collection | `collection-folder` | `<CollectionFolder />` |
| Smart collection | `collection-smart` | `<CollectionSmart />` |
| Shared collection | `collection-shared` | `<CollectionShared />` |
| Private collection | `collection-private` | `<CollectionPrivate />` |
| Featured | `collection-featured` | `<CollectionFeatured />` |
| Recent | `collection-recent` | `<CollectionRecent />` |
| All items | `collection-all` | `<CollectionAll />` |
| Trash | `collection-trash` | `<CollectionTrash />` |
| Restore | `restore-item` | `<RestoreItem />` |
| Add tag | `tag-add` | `<TagAdd />` |
| Remove tag | `tag-remove` | `<TagRemove />` |
| Auto tag | `tag-auto` | `<TagAuto />` |
| Tag cloud | `tag-cloud` | `<TagCloud />` |
| Advanced search | `search-advanced` | `<SearchAdvanced />` |
| Semantic search | `search-semantic` | `<SearchSemantic />` |
| Full text search | `search-fulltext` | `<SearchFulltext />` |
| Filter results | `search-filter` | `<SearchFilter />` |
| Sort results | `search-sort` | `<SearchSort />` |
| Search history | `search-history` | `<SearchHistory />` |
| Saved search | `search-saved` | `<SearchSaved />` |
| No results | `search-noresults` | `<SearchNoresults />` |
| Hierarchy view | `hierarchy-tree` | `<HierarchyTree />` |
| Breadcrumb | `breadcrumb-nav` | `<BreadcrumbNav />` |
| Expand all | `expand-all` | `<ExpandAll />` |
| Collapse all | `collapse-all` | `<CollapseAll />` |
| Drill down | `drill-down` | `<DrillDown />` |
| Drill up | `drill-up` | `<DrillUp />` |
| Navigate | `navigate-to` | `<NavigateTo />` |
| Backtrack | `backtrack-path` | `<BacktrackPath />` |
| Favorites | `favorites-heart` | `<FavoritesHeart />` |
| Reading list | `reading-list` | `<ReadingList />` |
| Watchlist | `watchlist-eye` | `<WatchlistEye />` |
| Grid view | `view-grid` | `<ViewGrid />` |
| List view | `view-list` | `<ViewList />` |
| Card view | `view-card` | `<ViewCard />` |

---

## ACU Evolution Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Quality score | `quality-score` | `<QualityScore />` |
| High quality | `quality-high` | `<QualityHigh />` |
| Medium quality | `quality-medium` | `<QualityMedium />` |
| Low quality | `quality-low` | `<QualityLow />` |
| Improve quality | `quality-improve` | `<QualityImprove />` |
| Accuracy | `accuracy-target` | `<AccuracyTarget />` |
| Relevance | `relevance-filter` | `<RelevanceFilter />` |
| Freshness | `freshness-clock` | `<FreshnessClock />` |
| Compose ACUs | `acu-compose` | `<AcuCompose />` |
| Decompose ACU | `acu-decompose` | `<AcuDecompose />` |
| Relate ACUs | `acu-relate` | `<AcuRelate />` |
| Embed ACU | `acu-embed` | `<AcuEmbed />` |
| Reference ACU | `acu-reference` | `<AcuReference />` |
| Parent ACU | `acu-parent` | `<AcuParent />` |
| Child ACU | `acu-child` | `<AcuChild />` |
| Sibling ACUs | `acu-sibling` | `<AcuSibling />` |
| Ancestry | `acu-ancestry` | `<AcuAncestry />` |
| Descendants | `acu-descendants` | `<AcuDescendants />` |
| Version tag | `version-tag` | `<VersionTag />` |
| Version history | `version-history` | `<VersionHistory />` |
| Version compare | `version-compare` | `<VersionCompare />` |
| Version restore | `version-restore` | `<VersionRestore />` |
| Version diff | `version-diff` | `<VersionDiff />` |
| Latest version | `version-latest` | `<VersionLatest />` |
| Draft | `version-draft` | `<VersionDraft />` |
| Published | `version-published` | `<VersionPublished />` |
| Snapshot | `snapshot-save` | `<SnapshotSave />` |
| Rollback | `version-rollback` | `<VersionRollback />` |
| Evolution | `evolution-growth` | `<EvolutionGrowth />` |
| Lifecycle | `lifecycle-cycle` | `<LifecycleCycle />` |
| Milestone | `milestone-flag` | `<MilestoneFlag />` |
| Influence | `influence-waves` | `<InfluenceWaves />` |
| Impact | `impact-score` | `<ImpactScore />` |
| Adoption | `adoption-rate` | `<AdoptionRate />` |
| Duplication | `duplicate-detect` | `<DuplicateDetect />` |

---

## Sync & Realtime Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Sync | `sync-arrows` | `<SyncArrows />` |
| Sync all | `sync-all` | `<SyncAll />` |
| Sync pending | `sync-pending` | `<SyncPending />` |
| Sync progress | `sync-progress` | `<SyncProgress />` |
| Sync complete | `sync-complete` | `<SyncComplete />` |
| Sync error | `sync-error` | `<SyncError />` |
| Sync conflict | `sync-conflict` | `<SyncConflict />` |
| Sync retry | `sync-retry` | `<SyncRetry />` |
| Sync cancel | `sync-cancel` | `<SyncCancel />` |
| Sync settings | `sync-settings` | `<SyncSettings />` |
| P2P | `p2p-nodes` | `<P2PNodes />` |
| Peer connected | `peer-connected` | `<PeerConnected />` |
| Peer disconnected | `peer-disconnected` | `<PeerDisconnected />` |
| Network mesh | `network-mesh` | `<NetworkMesh />` |
| Node online | `node-online` | `<NodeOnline />` |
| Node offline | `node-offline` | `<NodeOffline />` |
| Node syncing | `node-syncing` | `<NodeSyncing />` |
| Discover peers | `peer-discover` | `<PeerDiscover />` |
| Invite peer | `peer-invite` | `<PeerInvite />` |
| Remove peer | `peer-remove` | `<PeerRemove />` |
| WebSocket | `websocket-active` | `<WebsocketActive />` |
| Realtime | `realtime-bolt` | `<RealtimeBolt />` |
| Live | `connection-live` | `<ConnectionLive />` |
| Connected | `connection-connected` | `<ConnectionConnected />` |
| Disconnected | `connection-disconnected` | `<ConnectionDisconnected />` |
| Reconnecting | `connection-reconnect` | `<ConnectionReconnect />` |
| Connection quality | `connection-quality` | `<ConnectionQuality />` |
| Ping | `connection-ping` | `<ConnectionPing />` |
| Latency | `connection-latency` | `<ConnectionLatency />` |
| Heartbeat | `connection-heartbeat` | `<ConnectionHeartbeat />` |
| Online | `presence-online` | `<PresenceOnline />` |
| Away | `presence-away` | `<PresenceAway />` |
| Busy | `presence-busy` | `<PresenceBusy />` |
| Offline | `presence-offline` | `<PresenceOffline />` |
| Invisible | `presence-invisible` | `<PresenceInvisible />` |
| Last seen | `presence-lastseen` | `<PresenceLastseen />` |
| Background sync | `sync-background` | `<SyncBackground />` |
| Sync queue | `sync-queue` | `<SyncQueue />` |
| Prioritize sync | `sync-prioritize` | `<SyncPrioritize />` |
| Sync frequency | `sync-frequency` | `<SyncFrequency />` |
| Sync now | `sync-now` | `<SyncNow />` |
| Auto sync | `sync-auto` | `<SyncAuto />` |
| Manual sync | `sync-manual` | `<SyncManual />` |
| Battery sync | `sync-battery` | `<SyncBattery />` |
| WiFi only | `sync-wifi` | `<SyncWifi />` |

---

## Analytics Icons

| Usage | Icon Name | Component |
|-------|-----------|-----------|
| Views | `metric-views` | `<MetricViews />` |
| Likes | `metric-likes` | `<MetricLikes />` |
| Comments | `metric-comments` | `<MetricComments />` |
| Shares | `metric-shares` | `<MetricShares />` |
| Saves | `metric-saves` | `<MetricSaves />` |
| Clicks | `metric-clicks` | `<MetricClicks />` |
| Impressions | `metric-impressions` | `<MetricImpressions />` |
| Reach | `metric-reach` | `<MetricReach />` |
| Engagement rate | `metric-engagement` | `<MetricEngagement />` |
| Response time | `metric-response` | `<MetricResponse />` |
| Load time | `metric-loadtime` | `<MetricLoadtime />` |
| Latency | `metric-latency` | `<MetricLatency />` |
| Throughput | `metric-throughput` | `<MetricThroughput />` |
| Uptime | `metric-uptime` | `<MetricUptime />` |
| Errors | `metric-errors` | `<MetricErrors />` |
| Success rate | `metric-success` | `<MetricSuccessRate />` |
| Conversion | `metric-conversion` | `<MetricConversion />` |
| Retention | `metric-retention` | `<MetricRetention />` |
| Churn | `metric-churn` | `<MetricChurn />` |
| Active users | `metric-active-users` | `<MetricActiveUsers />` |
| New users | `metric-new-users` | `<MetricNewUsers />` |
| Returning users | `metric-returning` | `<MetricReturning />` |
| Session duration | `metric-session` | `<MetricSession />` |
| Pages per session | `metric-pages-session` | `<MetricPagesSession />` |
| Bounce rate | `metric-bounce` | `<MetricBounce />` |
| Demographics | `metric-demographics` | `<MetricDemographics />` |
| Device breakdown | `metric-devices` | `<MetricDevices />` |
| Location map | `metric-location` | `<MetricLocation />` |
| Traffic source | `metric-traffic` | `<MetricTraffic />` |
| Content growth | `metric-content-growth` | `<MetricContentGrowth />` |
| Content types | `metric-content-types` | `<MetricContentTypes />` |
| Popular content | `metric-popular` | `<MetricPopular />` |
| Trending | `metric-trending` | `<MetricTrending />` |
| Top contributors | `metric-top-contributors` | `<MetricTopContributors />` |
| Content health | `metric-health` | `<MetricHealth />` |
| Duplication rate | `metric-duplication` | `<MetricDuplication />` |
| Quality trend | `metric-quality-trend` | `<MetricQualityTrend />` |
| Dashboard | `analytics-dashboard` | `<AnalyticsDashboard />` |
| Charts | `analytics-charts` | `<AnalyticsCharts />` |
| Data table | `analytics-table` | `<AnalyticsTable />` |
| Export data | `analytics-export` | `<AnalyticsExport />` |
| Date range | `analytics-date-range` | `<AnalyticsDateRange />` |
| Custom report | `analytics-report` | `<AnalyticsReport />` |
| Scheduled report | `analytics-scheduled` | `<AnalyticsScheduled />` |
| Analytics alerts | `analytics-alerts` | `<AnalyticsAlerts />` |
| AI insights | `analytics-insights` | `<AnalyticsInsights />` |
| Anomalies | `analytics-anomalies` | `<AnalyticsAnomalies />` |

---

*Document Version: 2.0*  
*Updated: February 9, 2026*
