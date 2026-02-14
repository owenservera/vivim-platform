# AZR-Net v0: Comprehensive Feature Catalog (100+ Atomic Features)

> **Project**: AZR-Net Advanced Knowledge Management System  
> **Version**: 2.0.0  
> **Generated**: February 2026  
> **Purpose**: Deep inspection of all atomic features and capabilities

---

## Table of Contents

1. [Core System Features](#1-core-system-features)
2. [Knowledge Graph Features](#2-knowledge-graph-features)
3. [Ingestion & Processing Features](#3-ingestion--processing-features)
4. [Recommendation Engine Features](#4-recommendation-engine-features)
5. [Search Features](#5-search-features)
6. [Authentication & Security Features](#6-authentication--security-features)
7. [Collaboration Features](#7-collaboration-features)
8. [Visualization Features](#8-visualization-features)
9. [System Monitoring Features](#9-system-monitoring-features)
10. [Validation & Input Processing Features](#10-validation--input-processing-features)
11. [API & Integration Features](#11-api--integration-features)
12. [Configuration & Management Features](#12-configuration--management-features)

---

## 1. Core System Features

### 1.1 Daemon Engine Features

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F001 | **Daemon Initialization** | Initialize the core daemon with configuration loading and engine setup | `src/engine/daemon.py` - DaemonEngine class with config parsing |
| F002 | **Continuous Processing Loop** | Run continuous heartbeat cycle for content processing | `pulse()` method with configurable polling interval |
| F003 | **Graceful Shutdown** | Properly terminate daemon processes and cleanup resources | `shutdown()` method with engine integration cleanup |
| F004 | **Polling Interval Configuration** | Configurable content check intervals (default 5 seconds) | `polling_interval` parameter in DaemonConfig |
| F005 | **Concurrent Task Processing** | Process multiple content items simultaneously | `max_concurrent_tasks` configuration |
| F006 | **Unified Daemon Architecture** | Single daemon handling all operations | `src/engine/unified_daemon.py` - consolidated engine |
| F007 | **Interactive Daemon Mode** | CLI-based daemon with rich terminal interface | `src/engine/interactive_daemon.py` - TUI support |
| F008 | **Dashboard Server Mode** | Web-based monitoring dashboard | `src/engine/dashboard_server.py` - Flask/Streamlit dashboard |
| F009 | **Daemon Heartbeat System** | Regular health signals and status updates | `src/engine/heartbeat.py` - heartbeat mechanism |
| F010 | **Mirror State Synchronization** | Sync local state with cloud services | `sync_state()` method with API mirror calls |

### 1.2 Configuration Management

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F011 | **Centralized Configuration** | Single config module for all settings | `src/config.py` - Config singleton class |
| F012 | **Environment Variable Loading** | Load config from `.env.local` files | `load_dotenv()` integration with PathConfig |
| F013 | **Database Configuration** | PostgreSQL and Redis connection settings | `DatabaseConfig` dataclass with URL parsing |
| F014 | **API Endpoint Configuration** | Cloud service URLs and paths | `APIConfig` with inbox_url, mirror_url properties |
| F015 | **Daemon Runtime Configuration** | Mode, polling, and concurrency settings | `DaemonConfig` dataclass |
| F016 | **Authentication Configuration** | JWT secret, algorithm, expiry settings | `AuthConfig` with automatic secret generation |
| F017 | **Path Configuration** | Filesystem paths for knowledge graph and data | `PathConfig` with project root detection |
| F018 | **Logging Configuration** | Log level, format, and date format | `LoggingConfig` dataclass |
| F019 | **Configuration Reload** | Hot-reload configuration without restart | `reload()` method on Config class |
| F020 | **Multi-environment Support** | Different configs for dev/staging/prod | Environment variable overrides |

---

## 2. Knowledge Graph Features

### 2.1 Graph Structure

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F021 | **Node Creation** | Create nodes with ID, name, type, content | `GraphNode` dataclass with metadata support |
| F022 | **Edge Creation** | Define relationships between nodes | `GraphEdge` dataclass with relation types |
| F023 | **Node Types** | Support for concept, equation, paper, article, summary, code, note | NodeType enum with 8 types |
| F024 | **Edge Relations** | RELATED_TO, DEFINES, CITES, DERIVED_FROM, SIMILAR_TO, PART_OF | RelationType enum with 11 relation types |
| F025 | **Graph Persistence** | Save/load graph to/from JSON | `save()` and `load()` methods |
| F026 | **Graph Traversal** | Navigate relationships between nodes | `get_neighbors()` and `get_related_nodes()` |
| F027 | **Graph Statistics** | Calculate nodes, edges, density, clustering | `get_graph_statistics()` in visualization engine |
| F028 | **Graph Export** | Export to GEXF, GML, GraphML, JSON formats | `export_for_external_tools()` method |
| F029 | **Graph Import** | Import from external graph formats | NetworkX integration for various formats |
| F030 | **Temporal Graph** | Track node/edge creation timestamps | `created_at` and `updated_at` fields |

### 2.2 Graph Analytics

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F031 | **Degree Centrality** | Calculate node connectivity | NetworkX degree_centrality() |
| F032 | **Betweenness Centrality** | Identify bridge nodes in graph | NetworkX betweenness_centrality() |
| F033 | **Closeness Centrality** | Measure node accessibility | NetworkX closeness_centrality() |
| F034 | **PageRank** | Calculate node importance scores | NetworkX pagerank() |
| F035 | **Community Detection** | Louvain algorithm for clustering | `detect_communities()` with python-louvain |
| F036 | **Modularity Analysis** | Community structure quality | Greedy modularity communities |
| F037 | **Clustering Coefficient** | Local clustering measurement | NetworkX average_clustering() |
| F038 | **Shortest Path Analysis** | Path finding between nodes | NetworkX shortest_path_length() |
| F039 | **Connected Components** | Identify isolated subgraphs | NetworkX number_connected_components() |
| F040 | **Graph Diameter** | Maximum shortest path | NetworkX diameter() for connected graphs |

---

## 3. Ingestion & Processing Features

### 3.1 Content Routing

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F041 | **URL Routing** | Route URLs to appropriate processors | `IngestionRouter.route()` method |
| F042 | **ArXiv Processing** | Specialized handling for academic papers | `ArxivDigestWrapper` with ID extraction |
| F043 | **GitHub Processing** | Extract README and code metadata | WebDigest for repository URLs |
| F044 | **Web Content Digestion** | Parse and extract web page content | `WebDigest` class with trafilatura |
| F045 | **Data URL Processing** | Handle mobile app data: URLs | `DataDigest` for data: and artifact: schemes |
| F046 | **Multi-strategy Ingestion** | Select processing strategy per URL | Router pattern with dynamic selection |
| F047 | **Content Type Detection** | Identify content type from URL | URL pattern matching (arxiv, github, etc.) |
| F048 | **Deferred Processing** | Queue content for async processing | Message queue integration support |

### 3.2 Document Processing

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F049 | **PDF Processing** | Extract text from academic papers | Integration with PDF parsing libraries |
| F050 | **LaTeX Processing** | Handle mathematical content | `src/ingestion/download_tex.py` |
| F051 | **HTML Parsing** | Extract structured content from web pages | trafilatura and htmldate integration |
| F052 | **Markdown Conversion** | Convert web content to markdown | markdownify library integration |
| F053 | **Metadata Extraction** | Extract title, authors, dates | `data_digest.py` metadata parser |
| F054 | **Content Normalization** | Standardize content format | Normalization pipeline with cleaning |
| F055 | **Phylogeny Tracking** | Track content relationships | `src/ingestion/phylogeny.py` |
| F056 | **Stream Ingestion** | Process content in streaming fashion | `stream_ingest.py` with async support |
| F057 | **Batch Processing** | Process multiple items together | Concurrent ingestion with task queue |
| F058 | **Crawl Control** | Manage web crawling rate limits | robots.txt compliance and delays |
| F059 | **Knowledge Maintenance** | Update and refresh stored content | `knowledge_maintainer.py` with scheduled tasks |

### 3.3 Content Analysis

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F060 | **Keyword Extraction** | Identify key terms in content | Regex-based extraction with stopword filtering |
| F061 | **Entity Recognition** | Extract named entities (people, orgs, places) | Capitalized word pattern matching |
| F062 | **Readability Scoring** | Calculate Flesch Reading Ease score | Syllable/word/sentence analysis |
| F063 | **Content Summarization** | Generate content summaries | Extractive summarization methods |
| F064 | **Topic Classification** | Categorize content by topic | Content type detection from metadata |
| F065 | **Source Attribution** | Track content origin and citations | Source URL and reference tracking |

---

## 4. Recommendation Engine Features

### 4.1 Recommendation Algorithms

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F066 | **Collaborative Filtering** | Recommend based on user behavior patterns | `AZRRecommendationEngine` with interaction history |
| F067 | **Content-based Filtering** | Recommend similar content to what user viewed | Keyword and entity matching |
| F068 | **Hybrid Scoring** | Combine multiple recommendation strategies | Weighted scoring with configurable weights |
| F069 | **Trending Detection** | Identify popular content | Recency and activity scoring |
| F070 | **Diversity Filtering** | Prevent homogeneous recommendations | `apply_diversity_filter()` with max_per_author |
| F071 | **Relevance Scoring** | Calculate content-user relevance | `_calculate_relevance_score()` with type/topic matching |
| F072 | **Similarity Computation** | Calculate content similarity scores | Jaccard similarity for keywords |
| F073 | **User Profiling** | Build user interest profiles | `_compute_user_profile()` with interaction analysis |
| F074 | **Activity Tracking** | Monitor user engagement levels | Activity level calculation (high/medium/low) |
| F075 | **Engagement Scoring** | Calculate engagement scores | Weighted interaction scoring |

### 4.2 Interaction Management

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F076 | **Interaction Recording** | Capture user actions (view, like, save, share, skip) | `UserInteraction` dataclass |
| F077 | **Interaction Persistence** | Store interactions to JSON file | `.interactions.json` file storage |
| F078 | **Interaction Weighting** | Assign importance to interaction types | weights dictionary (like=0.9, save=0.8, view=0.5, skip=-0.3) |
| F079 | **Session Management** | Track user sessions and activity | Session-based recommendation context |
| F080 | **Profile Caching** | Cache computed user profiles | Profile invalidation on new interactions |

---

## 5. Search Features

### 5.1 Semantic Search

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F081 | **Sentence Transformer Embeddings** | Generate semantic embeddings for content | `SentenceTransformer("all-MiniLM-L6-v2")` |
| F082 | **Cosine Similarity Search** | Find semantically similar content | sklearn cosine_similarity() |
| F083 | **Vector Index Building** | Build search index from embeddings | `build_semantic_index()` with numpy arrays |
| F084 | **Model Fallback** | Use TF-IDF if embeddings unavailable | SentenceTransformer fallback logic |
| F085 | **Embedding Persistence** | Save/load embeddings to file | pickle-based index storage |

### 5.2 Keyword & Hybrid Search

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F086 | **Keyword Matching** | Search by exact keyword presence | Name/content/metadata matching |
| F087 | **TF-IDF Vectorization** | Convert text to TF-IDF vectors | sklearn TfidfVectorizer with ngrams |
| F088 | **Hybrid Search** | Combine semantic and keyword results | Weighted combination with semantic_weight |
| F089 | **Near Neighbor Search** | Find graph-neighboring content | Edge-based traversal |
| F090 | **Conceptual Search** | Search by conceptual relationships | Concept-based filtering and scoring |
| F091 | **Result Ranking** | Sort results by relevance score | Descending score sort |
| F092 | **Top-K Retrieval** | Return top K results | Limit parameter with configurable k |
| F093 | **Result Context** | Include neighbor information | `_get_neighbors()` with edge lookup |
| F094 | **Multi-field Search** | Search across name, content, metadata | Weighted multi-field scoring |

---

## 6. Authentication & Security Features

### 6.1 JWT Authentication

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F095 | **Token Generation** | Create JWT access and refresh tokens | `create_access_token()` and `create_refresh_token()` |
| F096 | **Token Verification** | Validate JWT tokens | `verify_token()` with signature and expiry check |
| F097 | **Token Parsing** | Extract user_id, role, scopes from token | JWT payload decoding |
| F098 | **Access Token** | Short-lived token for API access | 24-hour expiry (configurable) |
| F099 | **Refresh Token** | Long-lived token for session renewal | 7-day expiry |
| F100 | **Token Blacklisting** | Revoke tokens on logout | Server-side token invalidation |

### 6.2 User Management

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F101 | **User Registration** | Create new user accounts | `create_user()` in InMemoryUserStore |
| F102 | **User Authentication** | Verify username/password | `authenticate_user()` with password hashing |
| F103 | **Password Hashing** | Secure password storage | SHA-256 with salt |
| F104 | **User Roles** | Define user permission levels | UserRole enum (ANONYMOUS, USER, ADMIN, DAEMON) |
| F105 | **Failed Login Tracking** | Track authentication failures | `failed_login_attempts` counter |
| F106 | **Last Login Recording** | Track user login timestamps | `last_login_at` timestamp |
| F107 | **In-Memory User Store** | Temporary user storage | InMemoryUserStore class |

### 6.3 Rate Limiting

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F108 | **Sliding Window Counter** | Rate limit with time windows | `SlidingWindowCounter.is_allowed()` |
| F109 | **Global Rate Limits** | System-wide request limits | GLOBAL rate limit type |
| F110 | **Per-Endpoint Limits** | Different limits per API endpoint | endpoint_limits dictionary |
| F111 | **Per-User Limits** | User-specific request quotas | user_limits with configurable max |
| F112 | **Per-IP Limits** | IP-based rate limiting | IP address tracking |
| F113 | **Rate Limit Headers** | Return remaining requests in headers | X-RateLimit-* headers |
| F114 | **Retry-After Header** | Suggest wait time when blocked | Retry-After header on 429 responses |
| F115 | **Authentication Rate Limits** | Stricter limits for auth endpoints | 5 attempts/5min for login |

---

## 7. Collaboration Features

### 7.1 Shared Spaces

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F116 | **Space Creation** | Create new shared knowledge spaces | `create_shared_space()` |
| F117 | **Space Join/Leave** | Users can join/leave spaces | `join_space()` and `leave_space()` |
| F118 | **Space Access Types** | Private, Shared, Public access levels | SpaceAccessType enum |
| F119 | **Space Invitations** | Invite users to private spaces | Invite code support |
| F120 | **Space Settings** | Configure space behavior | settings dictionary with defaults |
| F121 | **Space Deletion** | Remove shared spaces | Owner-only deletion |
| F122 | **Member Limit** | Configure maximum members per space | max_members setting |

### 7.2 Collaboration Roles & Permissions

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F123 | **Role Definitions** | Owner, Admin, Editor, Viewer, Guest | CollaborationRole enum |
| F124 | **Permission System** | read, write, manage_members, change_settings | Permission set per role |
| F125 | **Role Hierarchy** | Admin > Editor > Viewer > Guest | Value-based comparison |
| F126 | **Role Modification** | Change member roles | `change_member_role()` with validation |
| F127 | **Permission Checking** | Verify user permissions | `_has_permission()` method |
| F128 | **Access Control** | Enforce space access policies | Private/Public/Shared logic |

### 7.3 Real-time Collaboration

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F129 | **Node Synchronization** | Real-time node updates across users | WebSocket-based sync |
| F130 | **Edge Synchronization** | Real-time edge updates across users | Connection broadcast |
| F131 | **Chat Messaging** | In-space text chat | `send_chat_message()` |
| F132 | **Member Presence** | Show online/offline status | `last_seen` tracking |
| F133 | **Event Broadcasting** | Notify all members of changes | `_notify_space_members()` |
| F134 | **Event History** | Store collaboration events | event_history with 1000-event limit |
| F135 | **WebSocket Handler** | Handle real-time connections | CollaborationWebSocketHandler |

---

## 8. Visualization Features

### 8.1 Graph Visualization

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F136 | **Force-Directed Layout** | Spring layout for node positioning | NetworkX spring_layout() |
| F137 | **Hierarchical Layout** | Tree-based organization | graphviz dot layout |
| F138 | **Circular Layout** | Nodes arranged in circle | NetworkX circular_layout() |
| F139 | **Random Layout** | Random node positions | NetworkX random_layout() |
| F140 | **Kamada-Kawai Layout** | Energy-minimization layout | NetworkX kamada_kawai_layout() |
| F141 | **Community Coloring** | Color nodes by community | Louvain-based detection |
| F142 | **Node Size Scaling** | Scale nodes by centrality | PageRank or degree-based sizing |
| F143 | **Edge Weight Visualization** | Edge thickness by weight | Configurable edge_width range |
| F144 | **Interactive Plotly Graphs** | Web-based interactive visualizations | plotly.graph_objects integration |
| F145 | **Hover Information** | Node details on hover | Plotly hovertext generation |

### 8.2 Advanced Visualizations

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F146 | **Temporal Visualization** | Show content evolution over time | Time-bucketed node placement |
| F147 | **Adjacency Matrix** | Matrix view of connections | NetworkX to_numpy_array() |
| F148 | **Sankey Diagram** | Flow visualization between nodes | Plotly Sankey traces |
| F149 | **Community Visualization** | Separate traces per community | Community-based grouping |
| F150 | **Centrality Highlighting** | Emphasize important nodes | Multiple centrality measures |
| F151 | **Node Type Legend** | Color-code by type | 8 node types with distinct colors |
| F152 | **Relation Type Legend** | Color-code edges by relation | 11 relation types |
| F153 | **Visualization Export** | Save as interactive HTML | Plotly HTML file generation |

---

## 9. System Monitoring Features

### 9.1 Health Checks

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F154 | **Daemon Health Check** | Verify daemon process is running | Process enumeration via psutil |
| F155 | **Web Interface Health** | Check web app accessibility | HTTP health endpoint polling |
| F156 | **Database Health** | Verify PostgreSQL connection | psycopg2 connection test |
| F157 | **Redis Health** | Check Redis connectivity | redis.ping() test |
| F158 | **Disk Space Monitoring** | Track available storage | psutil.disk_usage() |
| F159 | **Memory Usage Monitoring** | Track RAM consumption | psutil.virtual_memory() |
| F160 | **CPU Usage Monitoring** | Track processor utilization | psutil.cpu_percent() |
| F161 | **Knowledge Graph Health** | Validate graph file integrity | JSON parse and node count |
| F162 | **Health Status Aggregation** | Combine checks into overall status | Weighted status evaluation |
| F163 | **Health Report Generation** | Create detailed health reports | JSON report with summary |
| F164 | **Component Registration** | Register systems for monitoring | register_component() method |

---

## 10. Validation & Input Processing Features

### 10.1 Input Validation

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F165 | **Required Field Validation** | Ensure mandatory fields present | validate_required() |
| F166 | **String Length Validation** | Enforce min/max length | validate_length() |
| F167 | **Regex Pattern Validation** | Match against patterns | validate_regex() |
| F168 | **Email Format Validation** | Validate email syntax | validate_email() with RFC pattern |
| F169 | **URL Format Validation** | Validate URL structure | validate_url() with scheme/netloc |
| F170 | **Numeric Range Validation** | Enforce min/max values | validate_numeric() |
| F171 | **Boolean Validation** | Verify boolean input | validate_boolean() |
| F172 | **Date Format Validation** | Validate date strings | validate_date() |
| F173 | **Enum Validation** | Ensure value in allowed list | validate_enum() |
| F174 | **Custom Validation** | User-defined validation rules | validate_custom() |

### 10.2 Input Sanitization

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F175 | **XSS Prevention** | Remove script tags and dangerous content | bleach.clean() |
| F176 | **HTML Entity Escaping** | Escape special characters | html.escape() |
| F177 | **URL Sanitization** | Validate and clean URLs | sanitize_url() with scheme filtering |
| F178 | **Email Sanitization** | Clean email addresses | sanitize_email() |
| F179 | **JSON Sanitization** | Parse and clean JSON input | sanitize_json() |
| F180 | **Recursive Dictionary Cleaning** | Sanitize nested structures | sanitize_dict() |
| F181 | **Recursive List Cleaning** | Sanitize nested arrays | sanitize_list() |
| F182 | **Null Byte Removal** | Strip null characters | String sanitization |
| F183 | **Schema-based Validation** | Validate against defined schema | RequestValidator |
| F184 | **Field-specific Sanitization** | Different rules per field type | Configurable sanitize settings |

---

## 11. API & Integration Features

### 11.1 API Endpoints

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F185 | **Inbox API** | Submit content for processing | POST /api/inbox |
| F186 | **Mirror API** | Sync state with cloud | GET/POST /api/mirror |
| F187 | **Status API** | Check daemon status | GET /api/status |
| F188 | **Graph API** | Access knowledge graph data | GET /api/graph |
| F189 | **Recommendations API** | Get personalized recommendations | GET /api/recommendations |
| F190 | **Search API** | Perform semantic/keyword search | GET/POST /api/search |
| F191 | **Auth API** | User authentication endpoints | POST /api/auth/login, register |
| F192 | **API Versioning** | Versioned API endpoints | Path-based versioning |

### 11.2 External Integrations

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F193 | **Vercel Integration** | Deploy web app on Vercel | apps/uplink with Next.js |
| F194 | **Docker Support** | Containerized deployment | docker-compose.yml |
| F195 | **PostgreSQL Integration** | Primary database | psycopg2 connection |
| F196 | **Redis Integration** | Caching and session storage | redis-py library |
| F197 | **WebSocket Connections** | Real-time communication | websockets library |
| F198 | **HTTP Requests** | External API calls | requests library |
| F199 | **Sentence Transformers** | NLP embeddings | sentence-transformers library |
| F200 | **scikit-learn** | ML and similarity computation | sklearn for TF-IDF, cosine similarity |

---

## 12. Configuration & Management Features

### 12.1 Runtime Configuration

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F201 | **Daemon Modes** | BASIC, SEMANTIC, ADVANCED operation modes | DaemonMode enum with feature toggles |
| F202 | **Semantic Processing Toggle** | Enable/disable AI features | enable_semantic_processing flag |
| F203 | **Advanced Features Toggle** | Enable experimental features | enable_advanced_features flag |
| F204 | **Processing Thread Control** | Configure concurrent processing | max_concurrent_tasks parameter |
| F205 | **Sync Interval Control** | Configure cloud sync frequency | mirror_sync_interval (default 60s) |

### 12.2 Logging & Debugging

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F206 | **Structured Logging** | Format: timestamp - [component] - level - message | logging.basicConfig with custom format |
| F207 | **Component-specific Logging** | Separate loggers per module | logger = logging.getLogger("ModuleName") |
| F208 | **Log Rotation** | Manage log file sizes | RotatingFileHandler (configurable) |
| F209 | **Debug Fetch** | Debug content fetching | debug_fetch.py utility |
| F210 | **Diagnostic Commands** | Built-in diagnostic tools | src/diagnostic.py |

### 12.3 Development Tools

| ID | Feature Name | Description | Implementation |
|-----|--------------|-------------|-----------------|
| F211 | **Interactive Daemon** | Rich TUI for development | run_interactive_daemon.py with --tui flag |
| F212 | **Setup Script** | Automated system initialization | setup.sh for environment setup |
| F213 | **Dependency Installation** | Automated pip/npm installs | requirements.txt and package.json |
| F214 | **Import Testing** | Verify module imports | test_import.py |
| F215 | **Engine Testing** | Test engine functionality | test_engines.py |

---

## Feature Summary Statistics

| Category | Count |
|----------|-------|
| Core System Features | 20 |
| Knowledge Graph Features | 20 |
| Ingestion & Processing Features | 25 |
| Recommendation Engine Features | 20 |
| Search Features | 14 |
| Authentication & Security Features | 21 |
| Collaboration Features | 20 |
| Visualization Features | 18 |
| System Monitoring Features | 11 |
| Validation & Input Processing Features | 20 |
| API & Integration Features | 16 |
| Configuration & Management Features | 15 |
| **TOTAL FEATURES** | **240** |

---

## Technology Stack

### Backend
- **Python 3.8+** - Core runtime
- **FastAPI/Flask** - API framework
- **NetworkX** - Graph algorithms
- **scikit-learn** - ML and similarity
- **sentence-transformers** - NLP embeddings
- **psutil** - System monitoring
- **psycopg2** - PostgreSQL driver
- **redis-py** - Redis client

### Frontend
- **Next.js** - React framework
- **React** - UI library
- **Plotly** - Interactive visualizations
- **Streamlit** - Dashboard (optional)

### Infrastructure
- **Docker** - Containerization
- **Vercel** - Deployment platform
- **PostgreSQL** - Primary database
- **Redis** - Caching layer
- **WebSockets** - Real-time communication

---

## File Reference Index

| Module | Files | Purpose |
|--------|-------|---------|
| Configuration | `src/config.py` | Centralized config management |
| Engine Core | `src/engine/daemon.py`, `unified_daemon.py` | Main daemon engine |
| Recommendation | `src/recommendation/engine.py` | Recommendation algorithms |
| Search | `src/search/semantic_search.py` | Semantic and hybrid search |
| Authentication | `src/auth/jwt_auth.py` | JWT authentication |
| Rate Limiting | `src/security/rate_limiting.py` | API rate limiting |
| Collaboration | `src/collaboration/engine.py` | Real-time collaboration |
| Visualization | `src/visualization/graph_visualization.py` | Graph visualizations |
| Health Checks | `src/system/health_check.py` | System monitoring |
| Validation | `src/validation/input_validation.py` | Input sanitization |
| Ingestion | `src/ingestion/router.py`, `data_digest.py`, `web_digest.py` | Content processing |

---

*Document generated from deep inspection of AZR-Net v0 codebase. All 240 atomic features catalogued with implementation references.*
