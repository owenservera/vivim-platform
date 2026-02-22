/**
 * Test Data Generator
 * Creates mock conversations for testing the recommendation system
 */

import type { Conversation } from './types';

/**
 * Generate test conversations for recommendation testing
 */
export function generateTestConversations(count: number = 25): Conversation[] {
  const topics = [
    'Rust memory management',
    'React Server Components',
    'TypeScript generics deep dive',
    'Python async/await patterns',
    'Docker container optimization',
    'GraphQL schema design',
    'Next.js app router',
    'PostgreSQL query optimization',
    'AWS Lambda performance',
    'Kubernetes deployment strategies'
  ];

  const providers: Array<'chatgpt' | 'claude' | 'gemini'> = ['chatgpt', 'claude', 'gemini'];

  const conversations: Conversation[] = [];

  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const provider = providers[i % providers.length];
    const daysAgo = Math.floor(Math.random() * 365);

    const hasCode = Math.random() > 0.3;
    const hasMermaid = Math.random() > 0.8;
    const isInteracted = Math.random() > 0.7;

    const conversation: Conversation = {
      id: `test-convo-${i + 1}`,
      title: topic,
      provider,
      sourceUrl: `https://${provider}.ai/share/test-${i + 1}`,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      exportedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: `msg-${i}-1`,
          role: 'user',
          content: `Tell me about ${topic}`,
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `msg-${i}-2`,
          role: 'assistant',
          content: `Here is some information about ${topic}. It is a very interesting subject...`,
          timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 + 1000).toISOString()
        }
      ],
      metadata: {
        model: provider === 'claude' ? 'claude-3.5-sonnet' : provider === 'chatgpt' ? 'gpt-4' : 'gemini-pro',
        language: 'en',
        tags: [topic.split(' ')[0].toLowerCase()]
      },
      stats: {
        totalMessages: Math.floor(Math.random() * 20) + 5,
        totalWords: Math.floor(Math.random() * 8000) + 500,
        totalCharacters: Math.floor(Math.random() * 50000) + 3000,
        totalCodeBlocks: hasCode ? Math.floor(Math.random() * 20) + 5 : 0,
        totalMermaidDiagrams: hasMermaid ? Math.floor(Math.random() * 3) + 1 : 0,
        totalImages: Math.floor(Math.random() * 3),
        timesViewed: isInteracted ? Math.floor(Math.random() * 15) + 1 : 0,
        lastViewedAt: isInteracted ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        wasExported: isInteracted && Math.random() > 0.5,
        wasShared: isInteracted && Math.random() > 0.8,
        hasUserNotes: isInteracted && Math.random() > 0.9
      },
      privacy: {
        level: 'local',
        updatedAt: new Date().toISOString()
      }
    };

    conversations.push(conversation);
  }

  return conversations;
}

/**
 * Rich demo conversations with realistic content for UI testing
 */
const RICH_DEMO_CONVERSATIONS = [
  {
    title: 'Building a Rust Web Server from Scratch',
    provider: 'claude' as const,
    tags: ['rust', 'web', 'backend'],
    messages: [
      { role: 'user' as const, content: 'How do I build a minimal HTTP web server in Rust without any external crates?' },
      { role: 'assistant' as const, content: 'Great question! Building a raw HTTP server in Rust using only the standard library is a fantastic way to understand both Rust and HTTP. Here\'s how:\n\n```rust\nuse std::net::{TcpListener, TcpStream};\nuse std::io::{Read, Write};\nuse std::thread;\n\nfn handle_client(mut stream: TcpStream) {\n    let mut buffer = [0; 1024];\n    stream.read(&mut buffer).unwrap();\n    \n    let response = "HTTP/1.1 200 OK\\r\\nContent-Type: text/plain\\r\\n\\r\\nHello, World!";\n    stream.write_all(response.as_bytes()).unwrap();\n}\n\nfn main() {\n    let listener = TcpListener::bind("127.0.0.1:8080").unwrap();\n    for stream in listener.incoming() {\n        let stream = stream.unwrap();\n        thread::spawn(|| handle_client(stream));\n    }\n}\n```\n\nThis spawns a new OS thread for each connection. For production use, you\'d want a thread pool.' },
      { role: 'user' as const, content: 'How can I add routing to this?' },
      { role: 'assistant' as const, content: 'To add routing, we need to parse the HTTP request line and match against registered routes:\n\n```rust\nuse std::collections::HashMap;\n\ntype Handler = fn(&str) -> String;\n\nstruct Router {\n    routes: HashMap<String, Handler>,\n}\n\nimpl Router {\n    fn new() -> Self {\n        Router { routes: HashMap::new() }\n    }\n    \n    fn get(&mut self, path: &str, handler: Handler) {\n        self.routes.insert(path.to_string(), handler);\n    }\n    \n    fn handle(&self, path: &str) -> String {\n        match self.routes.get(path) {\n            Some(handler) => handler(path),\n            None => "HTTP/1.1 404 Not Found\\r\\n\\r\\nNot Found".to_string(),\n        }\n    }\n}\n```\n\nThis gives you basic path matching. For dynamic routes (`:id` params), you\'d need a trie or regex-based matcher.' },
    ]
  },
  {
    title: 'TypeScript Generics & Conditional Types',
    provider: 'chatgpt' as const,
    tags: ['typescript', 'generics', 'types'],
    messages: [
      { role: 'user' as const, content: 'Can you explain infer in TypeScript conditional types with real examples?' },
      { role: 'assistant' as const, content: '`infer` in TypeScript is one of the most powerful features for type-level programming. It lets you extract parts of a type within a conditional type.\n\n**Basic infer:**\n```typescript\ntype ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;\n\ntype Fn = () => string;\ntype R = ReturnType<Fn>; // string\n```\n\n**Extracting promise value:**\n```typescript\ntype Awaited<T> = T extends Promise<infer U> ? U : T;\n\ntype A = Awaited<Promise<string>>; // string\ntype B = Awaited<string>;          // string (passthrough)\n```\n\n**Recursive unwrapping:**\n```typescript\ntype DeepAwaited<T> = T extends Promise<infer U>\n  ? DeepAwaited<U>\n  : T;\n\ntype C = DeepAwaited<Promise<Promise<number>>>; // number\n```\n\n**Extracting tuple elements:**\n```typescript\ntype Head<T extends any[]> = T extends [infer H, ...any[]] ? H : never;\ntype Tail<T extends any[]> = T extends [any, ...infer R] ? R : never;\n\ntype H = Head<[1, 2, 3]>; // 1\ntype T = Tail<[1, 2, 3]>; // [2, 3]\n```' },
      { role: 'user' as const, content: 'What about using infer to extract function parameter types?' },
      { role: 'assistant' as const, content: '```typescript\n// Extract parameter types as a tuple\ntype Parameters<T extends (...args: any) => any> =\n  T extends (...args: infer P) => any ? P : never;\n\n// Extract a specific parameter by index\ntype FirstParam<T extends (...args: any) => any> =\n  Parameters<T> extends [infer F, ...any[]] ? F : never;\n\nfunction greet(name: string, age: number): void {}\n\ntype P  = Parameters<typeof greet>; // [string, number]\ntype P1 = FirstParam<typeof greet>; // string\n```\n\n**More complex: extracting method signatures from a class:**\n```typescript\ntype Methods<T> = {\n  [K in keyof T as T[K] extends Function ? K : never]: T[K]\n};\n\nclass MyService {\n  id: number = 1;\n  greet(name: string): string { return `Hi ${name}`; }\n  log(): void { console.log(this.id); }\n}\n\ntype ServiceMethods = Methods<MyService>;\n// { greet: (name: string) => string; log: () => void }\n```' },
    ]
  },
  {
    title: 'React Performance Optimization Patterns',
    provider: 'gemini' as const,
    tags: ['react', 'performance', 'frontend'],
    messages: [
      { role: 'user' as const, content: 'My React app is slow. What are the most impactful performance optimizations I should do first?' },
      { role: 'assistant' as const, content: 'Here\'s a prioritized list of React performance wins, from most to least impactful:\n\n**1. Virtualize long lists (biggest win)**\n```tsx\nimport { FixedSizeList } from \'react-window\';\n\nconst Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (\n  <div style={style}>Row {index}</div>\n);\n\nconst VirtualList = () => (\n  <FixedSizeList height={600} itemCount={10000} itemSize={35} width="100%">\n    {Row}\n  </FixedSizeList>\n);\n```\n\n**2. Avoid unnecessary re-renders**\n```tsx\n// ❌ Creates new object reference every render\nconst style = { color: \'red\' };\n\n// ✅ Stable reference\nconst style = useMemo(() => ({ color: \'red\' }), []);\n\n// ✅ Or move outside component if static\nconst STYLE = { color: \'red\' } as const;\n```\n\n**3. Code splitting**\n```tsx\nconst HeavyChart = lazy(() => import(\'./HeavyChart\'));\n\nfunction App() {\n  return (\n    <Suspense fallback={<Skeleton />}>\n      <HeavyChart />\n    </Suspense>\n  );\n}\n```' },
      { role: 'user' as const, content: 'How do I profile which components are slow?' },
      { role: 'assistant' as const, content: 'Use the React DevTools Profiler — it\'s the best tool for this:\n\n1. Open React DevTools → Profiler tab\n2. Click Record, interact with the slow part, stop recording\n3. Look for components with long render times (big bars)\n\n**In code profiling with `<Profiler>`:**\n```tsx\nimport { Profiler } from \'react\';\n\nconst onRender = (\n  id: string,\n  phase: "mount" | "update",\n  actualDuration: number,\n) => {\n  if (actualDuration > 16) {  // Slower than 60fps\n    console.warn(`Slow render: ${id} took ${actualDuration.toFixed(1)}ms (${phase})`);\n  }\n};\n\n<Profiler id="MyComponent" onRender={onRender}>\n  <MyComponent />\n</Profiler>\n```\n\n**Quick diagnosis checklist:**\n- `console.log` in render body → component updating too often\n- Use `React.memo` on children receiving stable props\n- Check that event handlers are `useCallback` wrapped\n- Verify context isn\'t causing mass re-renders (split contexts!)' },
    ]
  },
  {
    title: 'PostgreSQL Query Optimization',
    provider: 'chatgpt' as const,
    tags: ['postgresql', 'database', 'performance', 'sql'],
    messages: [
      { role: 'user' as const, content: 'My query is taking 30 seconds on a table with 10M rows. How do I debug and fix it?' },
      { role: 'assistant' as const, content: '**Step 1: EXPLAIN ANALYZE**\n```sql\nEXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\nSELECT * FROM orders\nWHERE user_id = 123 AND status = \'pending\'\nORDER BY created_at DESC\nLIMIT 20;\n```\n\nLook for:\n- `Seq Scan` on large tables → needs an index\n- `Hash Join` with large hash batches → memory pressure\n- High `actual rows` vs `estimated rows` ratio → stale statistics\n\n**Step 2: Update statistics**\n```sql\nANALYZE orders;\n-- Or for the whole DB:\nVACUUM ANALYZE;\n```\n\n**Step 3: Add the right index**\n```sql\n-- For WHERE + ORDER BY queries, a composite index works best:\nCREATE INDEX CONCURRENTLY idx_orders_user_status_created\nON orders (user_id, status, created_at DESC)\nWHERE status IN (\'pending\', \'processing\'); -- partial index!\n\n-- Verify the index is used:\nEXPLAIN SELECT * FROM orders\nWHERE user_id = 123 AND status = \'pending\'\nORDER BY created_at DESC LIMIT 20;\n-- Should show: Index Scan using idx_orders_user_status_created\n```' },
    ]
  },
  {
    title: 'Docker Multi-Stage Builds',
    provider: 'claude' as const,
    tags: ['docker', 'devops', 'containers'],
    messages: [
      { role: 'user' as const, content: 'How do multi-stage Docker builds work and why should I use them?' },
      { role: 'assistant' as const, content: 'Multi-stage builds let you use multiple `FROM` statements in one Dockerfile. The key benefit: **your final image only contains what\'s needed to run, not to build**.\n\n```dockerfile\n# Stage 1: Build\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\n# Stage 2: Runtime (tiny!)\nFROM node:20-alpine AS runtime\nWORKDIR /app\n\n# Only copy what we need to run\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY package.json .\n\nUSER node\nEXPOSE 3000\nCMD ["node", "dist/server.js"]\n```\n\n**Size comparison:**\n- Without multi-stage: ~800MB (includes dev tools, source maps, etc.)\n- With multi-stage: ~120MB (only runtime files)\n\n**Build caching tip:** Put `COPY package*.json` and `npm install` before `COPY . .` — this caches the dependency layer unless package.json changes.' },
      { role: 'user' as const, content: 'Can I cache build artifacts between CI runs?' },
      { role: 'assistant' as const, content: 'Yes! Use GitHub Actions cache + BuildKit:\n\n```yaml\n# .github/workflows/docker.yml\n- name: Set up Docker Buildx\n  uses: docker/setup-buildx-action@v3\n\n- name: Build and push\n  uses: docker/build-push-action@v5\n  with:\n    context: .\n    push: true\n    tags: myapp:latest\n    cache-from: type=gha          # Read from GitHub Actions cache\n    cache-to: type=gha,mode=max   # Write to GitHub Actions cache\n```\n\nThis can cut build times from 5 minutes to 30 seconds on cache hits!\n\n**Or use a registry cache:**\n```yaml\ncache-from: type=registry,ref=myregistry.io/myapp:buildcache\ncache-to: type=registry,ref=myregistry.io/myapp:buildcache,mode=max\n```' },
    ]
  },
  {
    title: 'GraphQL Schema Design Best Practices',
    provider: 'gemini' as const,
    tags: ['graphql', 'api', 'schema'],
    messages: [
      { role: 'user' as const, content: 'What are the most important rules for designing a good GraphQL schema?' },
      { role: 'assistant' as const, content: '**1. Design for the client, not the database**\n```graphql\n# ❌ Database-centric\ntype User {\n  user_id: ID!\n  first_name: String\n  last_name: String\n  created_at: String\n}\n\n# ✅ Client-centric\ntype User {\n  id: ID!\n  fullName: String!        # Computed, saves client-side string concat\n  displayName: String!     # "John D." format\n  createdAt: DateTime!     # Proper scalar\n  avatarUrl: String        # Full URL, not just path\n}\n```\n\n**2. Use connections for pagination**\n```graphql\ntype Query {\n  # ❌ Returns array - no pagination info\n  users: [User!]!\n  \n  # ✅ Cursor-based pagination\n  users(first: Int, after: String): UserConnection!\n}\n\ntype UserConnection {\n  edges: [UserEdge!]!\n  pageInfo: PageInfo!\n  totalCount: Int!\n}\n\ntype UserEdge {\n  node: User!\n  cursor: String!\n}\n```\n\n**3. Never expose internal IDs directly**\n```graphql\n# ❌ Leaks database internals\ntype Post { databaseId: Int! }\n\n# ✅ Opaque global IDs\ntype Post { id: ID! }  # base64 encoded "Post:123"\n```' },
    ]
  },
  {
    title: 'Understanding Kubernetes Pod Scheduling',
    provider: 'claude' as const,
    tags: ['kubernetes', 'k8s', 'devops'],
    messages: [
      { role: 'user' as const, content: 'How does the Kubernetes scheduler decide which node to place a pod on?' },
      { role: 'assistant' as const, content: 'The scheduler runs a **two-phase process** for each pod:\n\n**Phase 1: Filtering** — Eliminate nodes that can\'t run the pod\n- Not enough CPU/memory (`resources.requests`)\n- Node has a `Taint` the pod doesn\'t `Tolerate`\n- Pod has `nodeSelector` / `nodeAffinity` that doesn\'t match\n- Volume zone mismatch\n\n**Phase 2: Scoring** — Rank remaining nodes\n- `LeastAllocated`: Prefer nodes with most free resources\n- `ImageLocality`: Prefer nodes that already have the container image\n- `InterPodAffinity`: Prefer nodes near/far from specific pods\n- `NodeAffinity`: Weighted preference for labeled nodes\n\n**Example: Force pods to spread across zones:**\n```yaml\napiVersion: v1\nkind: Pod\nspec:\n  topologySpreadConstraints:\n  - maxSkew: 1\n    topologyKey: topology.kubernetes.io/zone\n    whenUnsatisfiable: DoNotSchedule\n    labelSelector:\n      matchLabels:\n        app: my-service\n```\n\nThis ensures no zone has more than 1 extra pod vs other zones.' },
    ]
  },
  {
    title: 'Python Async Patterns with asyncio',
    provider: 'chatgpt' as const,
    tags: ['python', 'async', 'asyncio'],
    messages: [
      { role: 'user' as const, content: 'What\'s the difference between asyncio.gather, asyncio.wait, and asyncio.TaskGroup?' },
      { role: 'assistant' as const, content: '**`asyncio.gather` — run concurrently, return results in order**\n```python\nimport asyncio\n\nasync def fetch(url: str) -> str:\n    await asyncio.sleep(0.1)  # Simulated IO\n    return f"data from {url}"\n\nasync def main():\n    # All 3 run concurrently, results in same order as input\n    results = await asyncio.gather(\n        fetch("api.example.com/users"),\n        fetch("api.example.com/posts"),\n        fetch("api.example.com/comments"),\n    )\n    # results = ["data from users", "data from posts", "data from comments"]\n```\n\n**`asyncio.TaskGroup` (Python 3.11+) — structured concurrency**\n```python\nasync def main():\n    async with asyncio.TaskGroup() as tg:\n        task1 = tg.create_task(fetch("api/users"))\n        task2 = tg.create_task(fetch("api/posts"))\n    # Both tasks guaranteed done here\n    # If ANY task raises, ALL others are cancelled\n    print(task1.result(), task2.result())\n```\n\n**Key differences:**\n| Feature | `gather` | `TaskGroup` |\n|---------|----------|-------------|\n| Error handling | Can mask errors | Propagates all |\n| Cancellation | Manual | Automatic |\n| Python version | 3.4+ | 3.11+ |\n| Structured | ❌ | ✅ |\n\n**Recommendation:** Use `TaskGroup` for new code if you\'re on Python 3.11+. It\'s safer.' },
    ]
  },
];

/**
 * Load rich demo data into storage — uses importFromV1 for reliability
 */
export async function loadTestDataIntoStorage(conversations?: Conversation[]): Promise<void> {
  console.log('[TestData] Starting demo data load...');

  try {
    const { getStorage } = await import('../storage-v2');
    const storage = getStorage();

    // Use rich demo conversations by default
    const demoConvos = RICH_DEMO_CONVERSATIONS;
    let successCount = 0;

    for (const convo of demoConvos) {
      try {
        await storage.importFromV1({
          title: convo.title,
          provider: convo.provider,
          messages: convo.messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        });
        successCount++;
        console.log(`[TestData] ✓ Imported: "${convo.title}"`);
      } catch (err) {
        console.warn(`[TestData] ✗ Failed to import "${convo.title}":`, err);
        // Continue with other conversations even if one fails
      }
    }

    // Also load the simple test conversations if a list was provided
    if (conversations && conversations.length > 0) {
      for (const convo of conversations.slice(0, 10)) {
        try {
          await storage.importFromV1({
            title: convo.title,
            provider: convo.provider || 'chatgpt',
            messages: convo.messages.map((m: any) => ({
              role: m.role,
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            })),
          });
          successCount++;
        } catch (err) {
          console.warn(`[TestData] ✗ Failed to import "${convo.title}":`, err);
        }
      }
    }

    if (successCount === 0) {
      throw new Error('All demo conversations failed to import. Check the browser console for details.');
    }

    console.log(`[TestData] ✓ Successfully loaded ${successCount}/${demoConvos.length} conversations`);
  } catch (err) {
    console.error('[TestData] Fatal error loading demo data:', err);
    throw err; // Re-throw so the UI can show the error
  }
}

/**
 * Generate high-quality conversations (for testing quality scoring)
 */
export function generateHighQualityConversations(count: number = 5): Conversation[] {
  const conversations = generateTestConversations(count);
  return conversations.map(convo => ({
    ...convo,
    stats: {
      ...convo.stats,
      totalCodeBlocks: Math.floor(Math.random() * 15) + 10,
      totalWords: Math.floor(Math.random() * 5000) + 3000,
      totalMermaidDiagrams: Math.floor(Math.random() * 3) + 2
    }
  }));
}

/**
 * Generate low-quality conversations (for testing quality scoring)
 */
export function generateLowQualityConversations(count: number = 5): Conversation[] {
  const conversations = generateTestConversations(count);
  return conversations.map(convo => ({
    ...convo,
    stats: {
      ...convo.stats,
      totalCodeBlocks: 0,
      totalWords: Math.floor(Math.random() * 100) + 20,
      totalMermaidDiagrams: 0,
      totalMessages: 2
    }
  }));
}

/**
 * Generate conversations from specific time periods
 */
export function generateConversationsByTimePeriod(): {
  yesterday: Conversation[];
  lastWeek: Conversation[];
  lastMonth: Conversation[];
  older: Conversation[];
} {
  const createConvo = (daysAgo: number, index: number): Conversation => {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return {
      id: `test-${daysAgo}d-${index}`,
      title: `Conversation from ${daysAgo === 1 ? 'yesterday' : daysAgo < 7 ? `${daysAgo} days ago` : `${Math.floor(daysAgo / 7)} weeks ago`}`,
      provider: 'claude',
      sourceUrl: `https://claude.ai/share/test-${daysAgo}-${index}`,
      createdAt: date.toISOString(),
      exportedAt: date.toISOString(),
      messages: [],
      metadata: { model: 'claude-3.5-sonnet', tags: ['test'] },
      stats: {
        totalMessages: 10,
        totalWords: 2000,
        totalCharacters: 12000,
        totalCodeBlocks: 5,
        totalMermaidDiagrams: 1,
        totalImages: 0,
        timesViewed: daysAgo < 7 ? 3 : 0,
        wasExported: false,
        wasShared: false,
        hasUserNotes: false
      },
      privacy: { level: 'local', updatedAt: date.toISOString() }
    };
  };

  return {
    yesterday:  [createConvo(1, 1), createConvo(1, 2)],
    lastWeek:   [createConvo(3, 1), createConvo(5, 1), createConvo(6, 1)],
    lastMonth:  [createConvo(14, 1), createConvo(21, 1), createConvo(28, 1)],
    older:      [createConvo(60, 1), createConvo(90, 1), createConvo(180, 1), createConvo(365, 1)]
  };
}
