

# Sovereign Memory v2.0 — Core Mathematics & Algorithms

---

## 1. Engram Representation & Multi-Space Embedding

### 1.1 Engram as a Mathematical Object

An engram $\mathcal{E}$ is a tuple:

$$\mathcal{E} = (c, \mathbf{e}, \tau, \alpha, \kappa, \Gamma)$$

where:

| Symbol | Domain | Meaning |
|--------|--------|---------|
| $c$ | $\mathcal{C}$ (content space) | Raw content (text, audio, image, etc.) |
| $\mathbf{e}$ | $\mathbb{R}^{d_1} \times \mathbb{R}^{d_2} \times \mathbb{R}^{d_3} \times \mathbb{R}^{d_4}$ | Multi-space embedding vector |
| $\tau$ | $\mathbb{R}^5$ | Temporal vector $(t_{\text{event}}, t_{\text{encode}}, t_{\text{access}}, t_{\text{utility}}, t_{\text{expiry}})$ |
| $\alpha$ | $[-1,1] \times [0,1]$ | Affective state (valence, arousal) |
| $\kappa$ | $[0,1] \times [0,1] \times \mathbb{Z}_{\geq 0}$ | Epistemic state (confidence, source reliability, inference depth) |
| $\Gamma$ | $\mathcal{P}(\mathcal{E} \times \mathcal{L} \times [0,1])$ | Edge set (target, label, weight) |

### 1.2 Multi-Space Embedding

Each engram is embedded into four vector spaces simultaneously. Let $\phi_i$ denote the embedding function for space $i$:

$$\mathbf{e} = \left(\phi_{\text{sem}}(c),\ \phi_{\text{epi}}(c, \alpha, \tau),\ \phi_{\text{temp}}(\tau),\ \phi_{\text{soc}}(c, \Gamma)\right)$$

**Semantic space** $\phi_{\text{sem}}: \mathcal{C} \to \mathbb{R}^{d_1}$

Standard transformer embedding. For content $c$ tokenized as $(w_1, \dots, w_n)$:

$$\phi_{\text{sem}}(c) = \frac{1}{n} \sum_{i=1}^{n} \text{TransformerBlock}(w_i, \text{context}(w_i))$$

with $d_1 = 1024$ and $L_2$ normalization: $\|\phi_{\text{sem}}(c)\| = 1$.

**Episodic space** $\phi_{\text{epi}}: \mathcal{C} \times [-1,1] \times [0,1] \times \mathbb{R}^5 \to \mathbb{R}^{d_2}$

Captures experiential similarity — memories that "feel" alike should be nearby:

$$\phi_{\text{epi}}(c, \alpha, \tau) = W_{\text{epi}} \left[ \phi_{\text{sem}}(c) \| \text{MLP}_{\alpha}(\alpha) \| \text{MLP}_{\tau}(\hat{\tau}) \right]$$

where $\|$ denotes concatenation, $\hat{\tau}$ is a cyclical encoding of temporal features:

$$\hat{\tau}_i = \left[\sin\left(\frac{2\pi \tau_i}{T_i}\right),\ \cos\left(\frac{2\pi \tau_i}{T_i}\right)\right]$$

with $T_i$ as period for each temporal dimension (hour-of-day: $T=24$, day-of-week: $T=7$, etc.), $d_2 = 512$.

**Temporal space** $\phi_{\text{temp}}: \mathbb{R}^5 \to \mathbb{R}^{d_3}$

Captures temporal pattern similarity (memories needed at similar times/phases):

$$\phi_{\text{temp}}(\tau) = W_{\text{temp}} \left[\hat{\tau}_{\text{cyclic}} \| \tau_{\text{linear}} \| \Delta\tau \right]$$

where $\Delta\tau = (\tau_{\text{access}} - \tau_{\text{encode}},\ \tau_{\text{utility}} - \tau_{\text{now}},\ \tau_{\text{access}} - \tau_{\text{event}})$ captures inter-temporal relationships, $d_3 = 256$.

**Social space** $\phi_{\text{soc}}: \mathcal{C} \times \Gamma \to \mathbb{R}^{d_4}$

Captures who-context via graph neighborhood aggregation:

$$\phi_{\text{soc}}(\mathcal{E}_i) = \text{MLP}\left(\phi_{\text{sem}}(c_i) + \frac{1}{|\mathcal{N}(i)|} \sum_{j \in \mathcal{N}(i)} w_{ij} \cdot \phi_{\text{sem}}(c_j)\right)$$

where $\mathcal{N}(i)$ is the graph neighborhood and $w_{ij}$ is edge weight, $d_4 = 256$.

### 1.3 Composite Distance Function

For retrieval, we define a **context-adaptive distance function** between a query $q$ and engram $\mathcal{E}$:

$$D(q, \mathcal{E}) = \sum_{i=1}^{4} \lambda_i(q) \cdot d_i(q, \mathcal{E}) + \lambda_5(q) \cdot d_{\text{graph}}(q, \mathcal{E}) + \lambda_6(q) \cdot d_{\text{temporal}}(q, \mathcal{E})$$

where:

$$d_i(q, \mathcal{E}) = 1 - \frac{\mathbf{e}_i^{(q)} \cdot \mathbf{e}_i^{(\mathcal{E})}}{\|\mathbf{e}_i^{(q)}\| \cdot \|\mathbf{e}_i^{(\mathcal{E})}\|}$$

The weights $\lambda_i(q)$ are **query-dependent**, computed by a lightweight attention mechanism over the query representation:

$$\boldsymbol{\lambda}(q) = \text{softmax}\left(W_\lambda \cdot \phi_{\text{sem}}(q) + b_\lambda\right) \in \Delta^5$$

where $\Delta^5$ is the 5-simplex. This means the system automatically learns that emotional queries should weight episodic space more heavily, factual queries should weight semantic space, and temporal queries ("what was I working on last Tuesday?") should weight temporal space.

---

## 2. The Engram Graph — Formal Structure & Algorithms

### 2.1 Formal Definition

The **Engram Graph** is a labeled, weighted, directed multigraph:

$$G = (V, E, \ell_V, \ell_E, w)$$

where:

- $V = \{\mathcal{E}_1, \dots, \mathcal{E}_n\}$ — engrams as vertices
- $E \subseteq V \times V \times \mathcal{L}$ — edges with label from label set $\mathcal{L}$
- $\mathcal{L} = \{\text{CAUSAL}, \text{TEMPORAL}, \text{ASSOCIATIVE}, \text{CONTRADICTS}, \text{ELABORATES}, \text{ABSTRACTS}, \text{PART\_OF}, \text{SEQUENCE}\}$
- $\ell_V: V \to \mathcal{T}$ — vertex type assignment (engram type)
- $\ell_E: E \to \mathcal{L}$ — edge label function
- $w: E \to [0, 1]$ — edge weight (connection strength)

### 2.2 Graph-Augmented Retrieval (GAR)

Standard vector retrieval misses structural context. GAR combines vector similarity with graph proximity in a single ranking:

**Algorithm: Graph-Augmented Retrieval**

```
Input: query q, parameters k (results), h (hops), α (graph weight)
Output: ranked list of k engrams

1. VECTOR_CANDIDATES ← HNSW_Search(φ_sem(q), top_m) ∪ 
                         HNSW_Search(φ_epi(q), top_m) ∪ 
                         BM25_Search(q, top_m)

2. GRAPH_EXPANSION ← ∅
   For each v ∈ VECTOR_CANDIDATES:
       GRAPH_EXPANSION ← GRAPH_EXPANSION ∪ BFS(v, depth=h, min_weight=θ)

3. CANDIDATES ← VECTOR_CANDIDATES ∪ GRAPH_EXPANSION

4. For each candidate c ∈ CANDIDATES:
       score_vector(c) = 1 - D(q, c)                    // composite distance
       score_graph(c) = PersonalizedPageRank(c, VECTOR_CANDIDATES)
       score_temporal(c) = TemporalRelevance(c, t_now)    // see §3
       score_epistemic(c) = κ.confidence × κ.source_reliability
       
       score(c) = (1-α) · score_vector(c) 
                  + α · score_graph(c) 
                  + β · score_temporal(c) 
                  + γ · score_epistemic(c)

5. Return top_k(CANDIDATES, by=score)
```

**Personalized PageRank** from seed set $S$ (the vector candidates):

$$\mathbf{r} = \alpha' \cdot \mathbf{s} + (1 - \alpha') \cdot \hat{A} \cdot \mathbf{r}$$

where $\mathbf{s}$ is the seed distribution (uniform over $S$, zero elsewhere), $\hat{A}$ is the column-normalized weighted adjacency matrix, and $\alpha' = 0.15$ is the teleport probability. Solved iteratively:

$$\mathbf{r}^{(t+1)} = \alpha' \cdot \mathbf{s} + (1 - \alpha') \cdot \hat{A} \cdot \mathbf{r}^{(t)}$$

Convergence in $O\left(\frac{\log(1/\epsilon)}{1 - (1-\alpha')}\right)$ iterations. For local computation (bounded neighborhood), use the push-based approximation algorithm with complexity $O(1/(\alpha' \cdot \epsilon))$ per seed node — independent of graph size.

### 2.3 Edge Weight Dynamics

Edge weights are not static. They evolve according to a **Hebbian-inspired reinforcement rule**: edges that are co-activated (both endpoints retrieved in the same context) are strengthened; edges that are not used decay.

**Update rule for edge $(i, j)$ at retrieval event $t$:**

$$w_{ij}^{(t+1)} = \begin{cases} \min\left(1,\ w_{ij}^{(t)} + \eta \cdot (1 - w_{ij}^{(t)})\right) & \text{if } i \text{ and } j \text{ co-retrieved at } t \\ w_{ij}^{(t)} \cdot e^{-\delta \cdot \Delta t} & \text{otherwise} \end{cases}$$

where:
- $\eta \in (0, 1]$ is the reinforcement learning rate (default: $0.1$)
- $\delta > 0$ is the decay rate (default: $0.001$ per day)
- $\Delta t$ is time since last co-retrieval

This implements "neurons that fire together wire together" — connections that are useful become stronger; unused connections fade. The decay term $e^{-\delta \Delta t}$ provides exponential forgetting of disused connections.

**Edge pruning**: Edges with $w_{ij} < \theta_{\min}$ (default: $0.01$) after decay are candidates for removal. The Dreaming Engine handles actual pruning during consolidation cycles.

### 2.4 Contradiction Detection via Graph Cycles

Two engrams contradict if they make incompatible claims. We detect this structurally:

**Definition**: A **contradiction candidate** is a pair $(\mathcal{E}_i, \mathcal{E}_j)$ such that:

1. $\text{sim}_{\text{sem}}(\mathcal{E}_i, \mathcal{E}_j) > \theta_{\text{topic}}$ (same topic), AND
2. $\text{sim}_{\text{content}}(\mathcal{E}_i, \mathcal{E}_j) < \theta_{\text{agree}}$ (different claims), AND
3. Both $\kappa_i.\text{confidence} > \theta_{\text{conf}}$ and $\kappa_j.\text{confidence} > \theta_{\text{conf}}$ (both confidently held)

**Formal contradiction score:**

$$\text{contra}(\mathcal{E}_i, \mathcal{E}_j) = \underbrace{\text{sim}_{\text{topic}}(i,j)}_{\text{topical overlap}} \times \underbrace{(1 - \text{sim}_{\text{claim}}(i,j))}_{\text{claim divergence}} \times \underbrace{\min(\kappa_i, \kappa_j)}_{\text{joint confidence}}$$

where $\text{sim}_{\text{topic}}$ uses the semantic embedding and $\text{sim}_{\text{claim}}$ uses an NLI (natural language inference) model output, mapping to entailment probability.

Pairs with $\text{contra}(\mathcal{E}_i, \mathcal{E}_j) > \theta_{\text{contra}}$ (default: $0.6$) are flagged, a CONTRADICTS edge is created, and the user is notified in the Dream Report.

---

## 3. Temporal Memory — Decay, Reinforcement & Anticipation

### 3.1 Memory Strength Model

Each engram has a **memory strength** $S(t)$ that determines retrieval priority. We adapt the ACT-R memory model from cognitive science:

$$S_i(t) = \ln\left(\sum_{k=1}^{n_i} (t - t_{i,k})^{-d}\right) + \beta_i + \epsilon_i(t)$$

where:
- $t_{i,k}$ is the time of the $k$-th retrieval of engram $i$
- $n_i$ is the total number of retrievals
- $d \in (0, 1)$ is the decay exponent (default: $d = 0.5$, fit from user's access patterns)
- $\beta_i$ is a **base-level bias** capturing intrinsic importance
- $\epsilon_i(t)$ is a context-dependent boost from the Theory of Mind engine

**Properties:**
- Recently accessed memories have high $S$
- Frequently accessed memories have high $S$
- Old, rarely accessed memories decay toward $-\infty$
- The summation over all access times means spacing effects are captured — distributed practice yields higher strength than massed practice

**Retrieval probability** (used for ranking):

$$P_i(t) = \frac{1}{1 + e^{-S_i(t)/\sigma}}$$

where $\sigma$ controls threshold sharpness. Memories with $P_i(t) < \theta_{\text{archive}}$ are candidates for cold storage.

### 3.2 Personalized Decay Estimation

The decay parameter $d$ is not universal — it varies by memory type, domain, and individual. We estimate it per user and per memory category using maximum likelihood estimation over the user's access history:

**Model**: Given observed retrievals at times $\{t_1, \dots, t_n\}$ and observed failures-to-retrieve (searches where the memory was relevant but not recalled by the user) at times $\{f_1, \dots, f_m\}$:

$$\mathcal{L}(d) = \sum_{k=1}^{n} \ln P_i(t_k; d) + \sum_{k=1}^{m} \ln(1 - P_i(f_k; d))$$

Optimize via gradient ascent:

$$d \leftarrow d + \eta \frac{\partial \mathcal{L}}{\partial d}$$

The system maintains separate decay estimates $d_{\text{type}}$ for each memory type and $d_{\text{domain}}$ for each domain, blended:

$$d_i = \omega_1 \cdot d_{\text{global}} + \omega_2 \cdot d_{\text{type}(i)} + \omega_3 \cdot d_{\text{domain}(i)}$$

with $\omega_1 + \omega_2 + \omega_3 = 1$, learned from data.

### 3.3 Anticipatory Retrieval — Predicting Future Utility

The system predicts **when** each engram will be needed next, enabling proactive surfacing.

**Context model**: Let $\mathbf{x}(t)$ be the user's current context vector at time $t$, encoding:

$$\mathbf{x}(t) = [\text{time-of-day}, \text{day-of-week}, \text{active-app}, \text{recent-queries}, \text{location}, \text{calendar-events}]$$

embedded into $\mathbb{R}^{d_{\text{ctx}}}$ via learned embedding.

**Retrieval prediction**: For each engram $\mathcal{E}_i$, we maintain a **context-retrieval history** $\{(\mathbf{x}(t_k), t_k)\}$ — the contexts in which it was retrieved. We model future retrieval probability as:

$$P(\text{retrieve } \mathcal{E}_i \mid \mathbf{x}(t)) = \sigma\left(\mathbf{w}_i^\top \mathbf{x}(t) + b_i + S_i(t)\right)$$

where $\mathbf{w}_i$ and $b_i$ are per-engram parameters learned from the access history via online logistic regression with L2 regularization:

$$\mathbf{w}_i \leftarrow \mathbf{w}_i + \eta \left(y_{it} - P(\text{retrieve } \mathcal{E}_i \mid \mathbf{x}(t))\right) \mathbf{x}(t) - \lambda \mathbf{w}_i$$

where $y_{it} \in \{0, 1\}$ indicates whether $\mathcal{E}_i$ was actually retrieved at time $t$.

**Scalability**: We don't maintain per-engram parameters for all engrams. Instead, we cluster engrams by topic/domain and maintain per-cluster parameters. Engrams inherit cluster parameters with optional per-engram residuals learned from sufficient access history.

**Anticipation algorithm:**

```
Input: current context x(t), anticipation window Δt, budget k
Output: pre-loaded "ready set" of k engrams

1. For each cluster C_j:
       P(retrieve from C_j | x(t)) = σ(w_j^T x(t) + b_j)
   
2. ACTIVE_CLUSTERS ← top_m clusters by P(retrieve)

3. For each engram E_i in ACTIVE_CLUSTERS:
       score(E_i) = P(retrieve E_i | x(t)) × S_i(t) × κ_i.confidence

4. READY_SET ← top_k engrams by score

5. Pre-load READY_SET into hot storage
```

### 3.4 Temporal Snapshots via Persistent Data Structures

To support mental state reconstruction ("what did I know at time $T$?"), the engram graph maintains **persistent versions**.

**Data structure**: Fat-node persistent graph. Each node and edge stores a list of $(\text{timestamp}, \text{value})$ pairs representing its version history.

**Node version list**:

$$\mathcal{E}_i.\text{versions} = [(t_1, v_1), (t_2, v_2), \dots, (t_k, v_k)]$$

where $v_j$ is the engram state at creation/modification time $t_j$.

**Query at time $T$**: For each node, binary search in the version list to find the latest version $\leq T$:

$$\text{state}(\mathcal{E}_i, T) = v_j \text{ where } j = \max\{k : t_k \leq T\}$$

**Space complexity**: $O(V + E + M)$ where $M$ is total number of modifications. In practice, most engrams are created once and modified rarely (during Dreaming Engine consolidation), so $M \approx c \cdot (V + E)$ with small $c$.

**Time complexity** for point-in-time query: $O((V + E) \cdot \log M_{\max})$ where $M_{\max}$ is the maximum version count per entity. Since $M_{\max}$ is typically small, this is effectively $O(V + E)$.

**Merkle root for ZK proofs**: At each temporal snapshot $T$, we compute:

$$\text{root}(T) = \text{MerkleRoot}\left(\{\text{hash}(\text{state}(\mathcal{E}_i, T)) : i = 1, \dots, |V|\}\right)$$

These roots are stored in a persistent log. A ZK proof that engram $\mathcal{E}_i$ existed with specific content at time $T$ is a Merkle inclusion proof against $\text{root}(T)$.

---

## 4. The Dreaming Engine — Consolidation Algorithms

### 4.1 Episodic-to-Semantic Promotion

Biological memory promotes repeated experiences into generalized knowledge. We formalize this:

**Cluster detection**: Find groups of episodic engrams that are semantically similar:

$$\text{clusters} = \text{HDBSCAN}\left(\{\phi_{\text{sem}}(\mathcal{E}_i) : \text{type}(\mathcal{E}_i) = \text{EPISODIC}\},\ \text{min\_cluster} = k_{\min}\right)$$

For each cluster $C = \{\mathcal{E}_{i_1}, \dots, \mathcal{E}_{i_m}\}$ with $m \geq k_{\text{promote}}$ (default: 3):

**Abstraction**: Generate a semantic engram by extracting the common pattern:

$$c_{\text{semantic}} = \text{LLM\_Abstract}\left(\{c_{i_1}, \dots, c_{i_m}\}\right)$$

The LLM is prompted to extract the general principle from the specific episodes.

**Confidence of promoted engram**:

$$\kappa_{\text{new}}.\text{confidence} = 1 - \prod_{j=1}^{m}(1 - \kappa_{i_j}.\text{confidence})$$

This is the probability that at least one source is correct (independence assumption, conservative).

**Connection to sources**: ABSTRACTS edges from the new semantic engram to each source episodic engram:

$$\Gamma_{\text{new}} = \{(\mathcal{E}_{i_j}, \text{ABSTRACTS}, w_j) : j = 1, \dots, m\}$$

where $w_j = \kappa_{i_j}.\text{confidence}$.

### 4.2 Novel Connection Discovery

Find pairs of engrams that are not directly connected but should be, based on latent similarity patterns.

**Algorithm: Latent Connection Mining**

```
Input: engram graph G, similarity threshold θ_connect, max proposals per cycle N
Output: proposed new edges

1. DISCONNECTED_PAIRS ← ∅
   
2. For each pair of engrams (E_i, E_j) where:
       - dist_graph(i, j) > h_min  (not already close in graph, e.g., > 3 hops)
       - sim_sem(E_i, E_j) > θ_connect  (semantically similar)
       - type(E_i) ≠ type(E_j) OR domain(E_i) ≠ domain(E_j)  (cross-type or cross-domain)
   Add (E_i, E_j, sim_sem) to DISCONNECTED_PAIRS

3. SCORED ← ∅
   For each (E_i, E_j, sim) in DISCONNECTED_PAIRS:
       novelty = 1 / (1 + |common_neighbors(i, j)|)
       utility = S_i(t) × S_j(t)     // both should be reasonably active
       score = sim × novelty × utility
       Add (E_i, E_j, score) to SCORED

4. PROPOSALS ← top_N(SCORED, by=score)

5. For each proposal, generate rationale via LLM:
       rationale = LLM("Why might these two memories be related?", E_i.content, E_j.content)

6. Return PROPOSALS with rationales
```

**Optimization for scalability**: Step 2 is $O(n^2)$ naively. We avoid this by:
1. For each engram, query its $k$-nearest neighbors in semantic space via HNSW
2. Filter to those with graph distance $> h_{\min}$
3. This reduces to $O(n \cdot k \cdot \log n)$ per cycle

### 4.3 Memory Merging (Deduplication with Preservation)

When two engrams cover the same information with high overlap:

**Merge criterion**: Engrams $\mathcal{E}_i$ and $\mathcal{E}_j$ are merge candidates if:

$$\text{sim}_{\text{sem}}(\mathcal{E}_i, \mathcal{E}_j) > \theta_{\text{merge}} \quad \text{AND} \quad \text{NLI}(c_i, c_j) = \text{ENTAILMENT (bidirectional)}$$

**Merge function**:

$$\mathcal{E}_{\text{merged}} = \text{Merge}(\mathcal{E}_i, \mathcal{E}_j) = \left(c_{\text{merged}}, \mathbf{e}_{\text{merged}}, \tau_{\text{merged}}, \alpha_{\text{merged}}, \kappa_{\text{merged}}, \Gamma_{\text{merged}}\right)$$

where:

$$c_{\text{merged}} = \text{LLM\_Merge}(c_i, c_j)$$

$$\mathbf{e}_{\text{merged}} = \frac{\kappa_i \cdot \mathbf{e}_i + \kappa_j \cdot \mathbf{e}_j}{\kappa_i + \kappa_j}$$

$$\tau_{\text{merged}}.\text{t\_event} = \min(\tau_i.\text{t\_event}, \tau_j.\text{t\_event})$$

$$\tau_{\text{merged}}.\text{t\_encode} = \text{now}$$

$$\kappa_{\text{merged}}.\text{confidence} = 1 - (1-\kappa_i)(1-\kappa_j) \quad \text{(independent corroboration)}$$

$$\alpha_{\text{merged}} = \frac{S_i(t) \cdot \alpha_i + S_j(t) \cdot \alpha_j}{S_i(t) + S_j(t)} \quad \text{(strength-weighted affect)}$$

$$\Gamma_{\text{merged}} = (\Gamma_i \cup \Gamma_j) \setminus \{(i,j), (j,i)\} \quad \text{(union of edges, remove mutual)}$$

The merged engram gets provenance entries pointing to both sources. Source engrams are moved to archive (not deleted) for a configurable period.

### 4.4 Counterfactual Simulation

Given a past decision engram $\mathcal{E}_d$ and new information engrams $\{\mathcal{E}_{n_1}, \dots, \mathcal{E}_{n_k}\}$ that arrived after the decision:

**Relevance score**:

$$\text{rel}(\mathcal{E}_d, \mathcal{E}_{n_j}) = \text{sim}_{\text{sem}}(\mathcal{E}_d, \mathcal{E}_{n_j}) \times \kappa_{n_j}.\text{confidence}$$

**Counterfactual trigger**: Generate a counterfactual when:

$$\max_j \text{rel}(\mathcal{E}_d, \mathcal{E}_{n_j}) > \theta_{\text{cf}} \quad \text{AND} \quad \text{type}(\mathcal{E}_d) = \text{EPISODIC with decision tag}$$

**Counterfactual generation**:

$$\text{cf} = \text{LLM}\left(\text{``Given decision context } c_d \text{ and new information } \{c_{n_j}\}, \text{ what might have changed?''}\right)$$

The counterfactual is stored as a new engram of type EPISODIC with a COUNTERFACTUAL_OF edge to $\mathcal{E}_d$, clearly marked as synthetic in provenance.

---

## 5. Theory of Mind Engine — User Modeling

### 5.1 Cognitive Style Estimation

The system learns the user's cognitive style from their interaction patterns using a latent factor model.

**Observable signals**:
- $q_t$: queries issued (what they search for, how they phrase it)
- $s_t$: selections made (which results they choose from retrieval)
- $r_t$: rejection signals (results shown but not used)
- $c_t$: creation patterns (what they explicitly store, how they describe it)
- $\tau_t$: temporal patterns (when they interact, how long)

**Latent cognitive state** $\mathbf{z} \in \mathbb{R}^{d_z}$ captures cognitive style:

$$P(\mathbf{z} \mid q_{1:T}, s_{1:T}, r_{1:T}, c_{1:T}) \propto P(\mathbf{z}) \prod_{t=1}^{T} P(s_t \mid q_t, \mathbf{z}) P(q_t \mid \mathbf{z}, \mathbf{x}_t)$$

In practice, we approximate this with a factored model:

$$\mathbf{z} = [\mathbf{z}_{\text{style}}, \mathbf{z}_{\text{temporal}}, \mathbf{z}_{\text{domain}}]$$

**Decision style estimation** — from retrieval selection patterns:

$$\hat{y}_{\text{style}} = \text{softmax}\left(W_{\text{style}} \cdot \text{MeanPool}\left(\{\phi_{\text{sem}}(s_t) - \phi_{\text{sem}}(q_t)\}_{t=1}^{T}\right)\right)$$

where $\hat{y}_{\text{style}} \in \{\text{analytical}, \text{intuitive}, \text{deliberative}\}$.

This captures whether the user tends to select results that exactly match their query (analytical) or results that are tangentially related (intuitive) or takes long pauses between query and selection (deliberative).

### 5.2 Context Prediction Model

**Active context estimation**: At each moment, the system estimates the probability distribution over domains the user is thinking about:

$$P(\text{domain} = d \mid \mathbf{x}(t)) = \text{softmax}\left(\mathbf{v}_d^\top \mathbf{x}(t) + b_d + \sum_{k=1}^{K} \gamma_k \cdot \mathbf{1}[\text{domain}_{t-k} = d]\right)$$

The autoregressive terms $\gamma_k$ capture domain stickiness — if you were working in "research" five minutes ago, you're likely still in "research."

**Goal inference**: The system maintains a belief distribution over user goals:

$$P(g \mid \mathbf{x}(t), q_{t-K:t}) \propto P(q_{t-K:t} \mid g) \cdot P(g \mid \mathbf{x}(t))$$

where $g \in \mathcal{G}$ is a set of goal templates learned from past behavior (e.g., "preparing for meeting with X", "researching topic Y", "reflecting on decision Z").

This drives anticipatory retrieval: if the system believes the user is "preparing for meeting with Client X" with probability 0.8, it pre-loads all Client X engrams into the ready set.

---

## 6. Hierarchical Encryption & Zero-Knowledge Proofs

### 6.1 Key Derivation Hierarchy

Starting from master seed $\mathcal{S}$ (256-bit entropy, encoded as BIP-39 mnemonic):

$$k_{\text{master}} = \text{HKDF-Expand}(\text{HKDF-Extract}(\text{salt}_0, \mathcal{S}),\ \text{``sovereign-memory-master''},\ 32)$$

**Identity keys** (Ed25519):

$$k_{\text{id\_seed}} = \text{HKDF-Expand}(k_{\text{master}},\ \text{``identity''},\ 32)$$

$$(sk_{\text{id}}, pk_{\text{id}}) = \text{Ed25519\_KeyGen}(k_{\text{id\_seed}})$$

**Domain keys** (XChaCha20-Poly1305):

$$k_{\text{domain}}^{(j)} = \text{HKDF-Expand}(k_{\text{master}},\ \text{``domain''} \| j \| \text{version},\ 32)$$

**Per-engram keys** (derived from domain key for efficiency):

$$k_{\text{engram}}^{(i)} = \text{HKDF-Expand}(k_{\text{domain}}^{(j)},\ \text{``engram''} \| \text{hash}(\mathcal{E}_i.\text{id}),\ 32)$$

**Encryption of engram content**:

$$\text{ct}_i = \text{XChaCha20-Poly1305.Encrypt}(k_{\text{engram}}^{(i)},\ \text{nonce}_i,\ \text{serialize}(\mathcal{E}_i.\text{content}),\ \text{aad}_i)$$

where $\text{aad}_i$ (additional authenticated data) includes the engram ID, type, domain, and timestamps — metadata that is authenticated but not encrypted, enabling metadata queries without decryption.

**Sharing key for recipient $R$**:

$$k_{\text{shared}}^{(j,R)} = \text{X25519}(sk_{\text{domain}}^{(j)},\ pk_R)$$

The domain key $k_{\text{domain}}^{(j)}$ is encrypted under $k_{\text{shared}}^{(j,R)}$ and sent to $R$. Recipient can then derive per-engram keys for that domain.

### 6.2 Domain-Level Cryptographic Deletion

To irrevocably delete a domain:

1. Securely erase $k_{\text{domain}}^{(j)}$ from all devices and backups
2. All engrams in domain $j$ become permanently undecryptable
3. Log the deletion event (timestamp + domain ID, no content)
4. No need to overwrite individual ciphertext — key destruction is sufficient

**Time complexity**: $O(1)$ regardless of domain size.

### 6.3 Social Recovery via Shamir's Secret Sharing

The master seed $\mathcal{S}$ is split into $n$ shares with threshold $k$:

$$(\text{share}_1, \dots, \text{share}_n) = \text{Shamir.Split}(\mathcal{S}, k, n)$$

using a random polynomial $f(x) = \mathcal{S} + a_1 x + a_2 x^2 + \dots + a_{k-1} x^{k-1}$ over $\text{GF}(2^{256})$:

$$\text{share}_i = (i, f(i))$$

Recovery requires any $k$ shares. Reconstruction uses Lagrange interpolation:

$$\mathcal{S} = f(0) = \sum_{j \in K} \text{share}_j \prod_{\substack{m \in K \\ m \neq j}} \frac{-m}{j - m}$$

where $K$ is the set of $k$ indices used. Shares are distributed to recovery delegates encrypted under their respective public keys.

### 6.4 Memory Staking — ZK Proof of Knowledge-at-Time

**Goal**: Prove "I knew content with hash $h$ at time $T$" without revealing content.

**Setup**: At each temporal checkpoint (e.g., daily), the system computes a Merkle tree over all engram content hashes:

$$\text{leaf}_i = \text{BLAKE3}(\text{serialize}(\mathcal{E}_i.\text{content}))$$

$$\text{root}(T) = \text{MerkleRoot}(\text{leaf}_1, \dots, \text{leaf}_n)$$

$\text{root}(T)$ is published (e.g., to a timestamping service, blockchain, or signed by a timestamp authority).

**Proof generation** for engram $\mathcal{E}_i$ at time $T$:

The Merkle inclusion proof is:

$$\pi = (\text{leaf}_i, \text{path}_i, \text{root}(T))$$

where $\text{path}_i$ is the sequence of sibling hashes along the path from $\text{leaf}_i$ to the root.

**Verification**:

$$\text{Verify}(\pi) = \left[\text{RecomputeRoot}(\text{leaf}_i, \text{path}_i) \stackrel{?}{=} \text{root}(T)\right]$$

This reveals $\text{leaf}_i = \text{BLAKE3}(content)$ but not the content itself. To prove knowledge of the content without revealing the hash, we wrap this in a SNARK:

**ZK circuit** (R1CS):

```
Public inputs:  root(T), commitment C
Private inputs: content, path, randomness r

Constraints:
1. leaf = BLAKE3(content)
2. RecomputeRoot(leaf, path) == root(T)
3. C == PedersenCommit(content, r)
```

The prover generates $\pi_{\text{zk}} = \text{Groth16.Prove}(\text{circuit}, \text{public}, \text{private})$.

**Verification**: $\text{Groth16.Verify}(\pi_{\text{zk}}, \text{root}(T), C)$ — runs in $O(1)$ with 3 pairing checks.

**Selective reveal**: Later, the user can open the Pedersen commitment by revealing $(content, r)$, allowing the verifier to check $C = g^{content} \cdot h^r$ and confirming the content matches the staked proof.

---

## 7. Cognitive Lensing — Mathematical Framework

### 7.1 Lens as a Transformation

A **lens** $L$ is a triple:

$$L = (F, O, R)$$

where:
- $F: V \to \{0, 1\}$ — **filter function** (which engrams to include)
- $O: V \times V \to \mathbb{R}$ — **ordering function** (how to sort/group)
- $R: \mathcal{E} \to \mathcal{E}'$ — **rendering function** (how to present each engram)

**Application**: $L(G) = (V', E', R)$ where $V' = \{v \in V : F(v) = 1\}$ and $E'$ is the induced subgraph.

### 7.2 Built-in Lens Definitions

**Causal lens**:

$$F_{\text{causal}}(v) = \mathbf{1}\left[\exists \text{ path of CAUSAL edges through } v\right]$$

$$O_{\text{causal}}(u, v) = \begin{cases} -1 & \text{if } (u, v, \text{CAUSAL}) \in E \\ 1 & \text{if } (v, u, \text{CAUSAL}) \in E \\ 0 & \text{otherwise} \end{cases}$$

This produces a topologically sorted view of causally connected memories.

**Epistemic lens**:

$$F_{\text{epistemic}}(v) = \mathbf{1}[\kappa_v.\text{confidence} > 0]$$

$$O_{\text{epistemic}}(u, v) = \kappa_v.\text{confidence} - \kappa_u.\text{confidence}$$

Sorted by certainty. Enables "what do I know for sure?" (top) and "what am I uncertain about?" (bottom).

**Emotional lens**:

$$F_{\text{emotional}}(v) = \mathbf{1}[|\alpha_v.\text{valence}| > \theta_{\text{emotion}} \text{ OR } \alpha_v.\text{arousal} > \theta_{\text{arousal}}]$$

$$O_{\text{emotional}}(u, v) = \alpha_v.\text{valence} - \alpha_u.\text{valence}$$

Groups memories by emotional quality. Navigate from joy to sorrow.

### 7.3 Lens Composition

Lenses compose via intersection and sequential application:

$$L_1 \circ L_2 = (F_1 \wedge F_2,\ O_1 \text{ then } O_2,\ R_1 \circ R_2)$$

Example: "Causal lens ∘ Epistemic lens" shows only causally connected memories, sorted by confidence. This enables powerful compound views without combinatorial explosion of built-in lens types.

### 7.4 Custom Lens via Ontological Mapping

Users define a custom ontology $\mathcal{O} = (C, H, M)$:
- $C$ = set of categories
- $H$ = hierarchy over $C$ (partial order)
- $M: V \to \mathcal{P}(C)$ = mapping function from engrams to categories

The mapping function can be:
- **Manual**: User assigns categories
- **Rule-based**: Pattern matching on content/metadata
- **ML-based**: Classifier trained on user's categorization examples

$$M_{\text{ML}}(v) = \text{argmax}_{c \in C}\ P(c \mid \phi_{\text{sem}}(v); \theta_{\text{classifier}})$$

The classifier is a lightweight MLP over the semantic embedding, trained on user-labeled examples with few-shot learning (minimum 3 examples per category).

---

## 8. Collective Memory — Multi-Party Algorithms

### 8.1 Secure Intersection via Private Set Intersection (PSI)

**Problem**: Determine if any collective member has experience with topic $T$ without revealing individual memories.

**Protocol** (based on ECDH-PSI):

Let members be $\{M_1, \dots, M_n\}$. Query: "Does anyone have engrams related to topic $T$?"

1. **Query encoding**: The querier $M_q$ computes $h_q = H(T)^{r_q}$ where $H$ is a hash-to-curve function and $r_q$ is a random scalar.

2. **Member response**: Each member $M_j$ computes:
   - For each of their relevant engram topics $\{T_{j,1}, \dots, T_{j,m}\}$:
     - $h_{j,i} = H(T_{j,i})^{r_j}$ (blinded hash of their topic)
   - They also compute $h_q' = h_q^{r_j}$ (double-blind the query)

3. **Intersection check**: The querier computes $h_{j,i}' = h_{j,i}^{r_q}$ for each member response.

   If $h_q' = h_{j,i}'$ for some $i$, then $T = T_{j,i}$ (match found).

**Privacy guarantee**: Neither party learns the other's topics beyond the intersection. The random blinding factors $r_q, r_j$ prevent reconstruction.

**Complexity**: $O(n \cdot m)$ exponentiations where $n$ is members and $m$ is average engrams per member. In practice, members pre-filter to engrams in relevant domains before running PSI.

### 8.2 Dissent-Preserving Merge

When two members contribute conflicting accounts of the same event:

**Conflict detection**: Same as contradiction detection (§4.4) but across member boundaries.

**Resolution protocol**:

$$\mathcal{E}_{\text{collective}} = \text{CollectiveEngram}\left(\begin{aligned} &\text{narrative}_A: c_A,\ \text{author}: \text{DID}_A,\ \text{confidence}: \kappa_A \\ &\text{narrative}_B: c_B,\ \text{author}: \text{DID}_B,\ \text{confidence}: \kappa_B \\ &\text{consensus}: c_{\text{consensus}} \text{ (if any)},\ \text{agreement}: \{A, B\} \cap \text{signers} \end{aligned}\right)$$

Both narratives are stored with cryptographic attribution. A consensus narrative can be added if both parties sign it. The collective engram type is CONTESTED until consensus is reached (which may be never — and that's fine).

### 8.3 Collective Knowledge Emergence

Emergent knowledge — insights that exist only in the collective, not in any individual memory:

**Algorithm: Knowledge Emergence Detection**

```
Input: collective engram graph G_C, member graphs {G_1, ..., G_n}
Output: emergent engrams

1. CROSS_MEMBER_EDGES ← {(E_i, E_j) ∈ G_C : author(E_i) ≠ author(E_j) 
                          AND sim_sem(E_i, E_j) > θ_emerge}

2. For each cross-member edge cluster C:
       coverage = |{author(E) : E ∈ C}| / n
       IF coverage > θ_coverage:
           E_emergent = LLM_Synthesize({E.content : E ∈ C})
           E_emergent.type = SEMANTIC
           E_emergent.provenance = {EMERGENCE from C}
           E_emergent.author = COLLECTIVE
           Add E_emergent to G_C with ABSTRACTS edges to all E ∈ C

3. Return new emergent engrams
```

The key insight: if multiple independent members have related but distinct knowledge, the synthesis may yield understanding that no individual possessed. This is formalized as:

$$\text{emergence}(C) = H_{\text{info}}\left(\text{synthesis}(C)\right) - \max_{i \in \text{authors}(C)} H_{\text{info}}\left(\text{knowledge}_i \cap \text{topic}(C)\right)$$

where $H_{\text{info}}$ measures information content. Positive emergence means the collective knows more than its most knowledgeable member on this topic.

---

## 9. Scale — Hierarchical Graph Algorithms

### 9.1 Graph Summarization for Billion-Scale Retrieval

At scale (>10M engrams), full graph operations become prohibitive. We introduce **hierarchical graph summarization**:

**Level 0**: Individual engrams (full graph $G_0$)

**Level $\ell$**: Cluster-level super-nodes. Each super-node $S_\ell^{(k)}$ represents a cluster of level-$(\ell-1)$ entities.

**Clustering**: We use a modified Louvain algorithm optimized for the engram graph:

**Modularity objective** with engram-specific weighting:

$$Q = \frac{1}{2W} \sum_{ij} \left(w_{ij} - \frac{s_i s_j}{2W}\right) \delta(c_i, c_j) + \lambda \sum_c \text{Coherence}(c)$$

where:
- $w_{ij}$ = edge weight
- $s_i = \sum_j w_{ij}$ = node strength
- $W = \sum_{ij} w_{ij}$ = total weight
- $c_i$ = cluster assignment of node $i$
- $\text{Coherence}(c) = \text{mean}_{i,j \in c} \text{sim}_{\text{sem}}(\mathcal{E}_i, \mathcal{E}_j)$ — semantic coherence bonus

The $\lambda$ term encourages clusters that are semantically meaningful, not just densely connected.

**Super-node representation**:

$$\phi_{\text{sem}}(S_\ell^{(k)}) = \frac{1}{|S_\ell^{(k)}|} \sum_{\mathcal{E}_i \in S_\ell^{(k)}} \phi_{\text{sem}}(\mathcal{E}_i) \quad \text{(centroid embedding)}$$

$$c_{S_\ell^{(k)}} = \text{LLM\_Summarize}\left(\{c_i : \mathcal{E}_i \in S_\ell^{(k)}\}\right) \quad \text{(content summary)}$$

$$\kappa_{S_\ell^{(k)}}.\text{confidence} = \frac{1}{|S_\ell^{(k)}|} \sum \kappa_i.\text{confidence} \quad \text{(mean confidence)}$$

**Hierarchical retrieval**: Search starts at the highest level and drills down:

```
Input: query q, hierarchy L levels, budget k
Output: k most relevant engrams

1. candidates ← top_m super-nodes at level L by sim_sem(q, S_L)

2. For ℓ = L-1 down to 0:
       expanded ← children of candidates at level ℓ
       candidates ← top_m of expanded by sim_sem(q, ·)

3. Return top_k of candidates (level 0 = actual engrams)
```

**Complexity**: $O(L \cdot m \cdot \log n)$ where $L$ is hierarchy depth ($L = \lceil \log_b n \rceil$ for branching factor $b$), $m$ is beam width per level. For $n = 10^9$ engrams and $b = 100$, $L = 5$, making retrieval practical.

### 9.2 Incremental Embedding Update

When a new engram is added, we avoid re-embedding the entire corpus:

1. Compute embeddings for the new engram: $O(1)$
2. Insert into HNSW indices (all 4 spaces): $O(\log n)$ per space
3. Update affected super-node centroids:

$$\phi_{\text{sem}}(S') = \frac{|S| \cdot \phi_{\text{sem}}(S) + \phi_{\text{sem}}(\mathcal{E}_{\text{new}})}{|S| + 1}$$

$O(L)$ updates up the hierarchy.

4. Check if new engram triggers cluster splitting (when coherence drops below threshold):

$$\text{Coherence}(S') < \theta_{\text{split}} \implies \text{re-cluster } S'$$

Re-clustering is local: only the affected super-node is split. $O(|S|)$ per split.

**Total insertion cost**: $O(L \cdot \log n)$ amortized.

### 9.3 CRDT Graph Sync

The engram graph is replicated across devices using a **delta-state CRDT** for property graphs.

**State**: Each device maintains:

$$\text{state}_d = (\text{Nodes}_d, \text{Edges}_d, \text{VectorClock}_d)$$

**Node CRDT**: Each node is a **Last-Writer-Wins Register** (LWW-Register) keyed by engram ID:

$$\text{Nodes} = \text{Map}\langle\text{EngamID}, \text{LWW-Register}\langle\text{EngamState}\rangle\rangle$$

**Edge CRDT**: Each edge is an **Observed-Remove Set** (OR-Set) to handle concurrent add/remove:

$$\text{Edges} = \text{OR-Set}\langle(\text{source}, \text{target}, \text{label}, \text{weight}, \text{unique\_tag})\rangle$$

**Merge operation**:

$$\text{state}_1 \sqcup \text{state}_2 = (\text{Nodes}_1 \sqcup \text{Nodes}_2,\ \text{Edges}_1 \sqcup \text{Edges}_2,\ \text{VC}_1 \sqcup \text{VC}_2)$$

where $\sqcup$ on LWW-Registers takes the entry with the higher timestamp, and $\sqcup$ on OR-Sets takes the union of add-sets minus the union of remove-sets.

**Convergence guarantee**: CRDTs are monotonically increasing in a join-semilattice. All replicas converge to the same state regardless of message ordering or delivery. This is a mathematical property — no consensus protocol required.

**Edge weight conflict resolution**: When two devices modify the same edge weight concurrently:

$$w_{\text{merged}} = \frac{w_1 \cdot \text{access\_count}_1 + w_2 \cdot \text{access\_count}_2}{\text{access\_count}_1 + \text{access\_count}_2}$$

This is an access-count-weighted average — the device where the edge was used more has more influence on the weight.

**Delta sync optimization**: Instead of sending full state, devices exchange deltas:

$$\Delta_{d_1 \to d_2} = \{(k, v) \in \text{state}_{d_1} : \text{VC}_{d_1}(k) > \text{VC}_{d_2}(k)\}$$

Only modified entries since last sync. Bandwidth: $O(|\text{changes}|)$, not $O(|\text{state}|)$.

---

## 10. Memory Query Language (MQL) — Formal Semantics

### 10.1 Query Algebra

MQL is grounded in a relational algebra extended with graph operations and vector similarity:

**Core operations:**

| Operation | Notation | Semantics |
|-----------|----------|-----------|
| Selection | $\sigma_{\text{pred}}(G)$ | Filter nodes by predicate |
| Projection | $\pi_{\text{fields}}(G)$ | Select specific fields |
| Traversal | $\tau_{\ell, h}(G, S)$ | From seed set $S$, follow edges of label $\ell$ for $h$ hops |
| Similarity | $\rho_{q, k}^{(s)}(G)$ | Top-$k$ by similarity to query $q$ in space $s$ |
| Temporal | $\omega_T(G)$ | Graph state at time $T$ |
| Aggregation | $\gamma_{f, \text{group}}(G)$ | Group by field, apply aggregate $f$ |
| Join | $G_1 \bowtie_{\text{pred}} G_2$ | Combine graphs on predicate |

### 10.2 Example Query Compilation

**MQL**:
```sql
TRACE decisions
  WHERE domain = "hiring"
  AND EXISTS downstream (
    WHERE sentiment < -0.3
    AND relation = "consequence_of"
  )
```

**Compiled algebra**:

$$\sigma_{\text{sentiment} < -0.3}\left(\tau_{\text{CONSEQUENCE\_OF},\ *}\left(\sigma_{\text{domain}=\text{hiring} \wedge \text{type}=\text{DECISION}}(G)\right)\right)$$

**Execution plan**:

```
1. INDEX_SCAN(domain="hiring", type="decision")     → candidate set C₁
2. For each e ∈ C₁:
       GRAPH_TRAVERSE(e, edge_type="consequence_of", direction=forward, depth=∞)
       → reachable set R(e)
3. FILTER(R(e), sentiment < -0.3)                    → consequences C₂(e)
4. RETURN {e ∈ C₁ : C₂(e) ≠ ∅} with matched consequences
```

**Cost model**: The query optimizer estimates cost as:

$$\text{Cost}(Q) = \sum_{\text{op} \in Q} |\text{input}(\text{op})| \times c_{\text{op}}$$

where $c_{\text{op}}$ is the per-element cost of each operation:
- Index scan: $c = O(\log n)$
- Graph traversal: $c = O(d_{\text{avg}}^h)$ where $d_{\text{avg}}$ is average degree and $h$ is depth
- Vector similarity: $c = O(\log n)$ (HNSW)
- LLM interpretation: $c = O(|input|)$ (token count)

The optimizer chooses between index-first and traversal-first strategies based on estimated selectivity of filter predicates.

---

## Summary of Core Algorithmic Complexities

| Algorithm | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| Multi-space embedding (per engram) | $O(\sum_i d_i \cdot |c|)$ | $O(\sum_i d_i)$ |
| Composite retrieval (GAR) | $O(m \cdot \log n + m \cdot d_{\text{avg}}^h + \frac{\log(1/\epsilon)}{\alpha'})$ | $O(m \cdot d_{\text{avg}}^h)$ |
| Hebbian edge update | $O(|\text{co-retrieved}|)$ | $O(1)$ per edge |
| Contradiction detection | $O(n \cdot k \cdot \log n)$ | $O(n \cdot k)$ |
| ACT-R memory strength | $O(n_i)$ per engram ($n_i$ = access count) | $O(n_i)$ |
| Anticipatory retrieval | $O(|C| \cdot d_{\text{ctx}})$ per cluster | $O(|C| \cdot d_{\text{ctx}})$ |
| Temporal snapshot query | $O((V+E) \cdot \log M_{\text{max}})$ | $O(V + E + M)$ |
| ZK proof generation | $O(n)$ constraint generation + $O(n \log n)$ FFT | $O(n)$ |
| ZK proof verification | $O(1)$ (3 pairings) | $O(1)$ |
| Hierarchical retrieval | $O(L \cdot m \cdot \log n)$ | $O(L \cdot m)$ |
| CRDT delta sync | $O(|\Delta|)$ | $O(|\text{state}|)$ |
| Dreaming cycle (full) | $O(n \cdot k \cdot \log n)$ | $O(n \cdot k)$ |
| Engram insertion | $O(L \cdot \log n)$ amortized | $O(\sum_i d_i + |\Gamma|)$ |
| Shamir recovery | $O(k^2)$ (Lagrange interpolation) | $O(k)$ |
| PSI query | $O(n \cdot m)$ exponentiations | $O(n \cdot m)$ |
| Lens application | $O(V + E)$ | $O(V' + E')$ |
| MQL query (worst case) | $O(V \cdot d_{\text{avg}}^h)$ | $O(V)$ |

where $n$ = total engrams, $m$ = beam width / candidate set size, $k$ = nearest neighbors or threshold shares, $d_{\text{avg}}$ = average graph degree, $h$ = traversal depth, $L$ = hierarchy levels, $M$ = total modifications, $d_i$ = embedding dimension for space $i$, $|\Gamma|$ = edges per engram, $|C|$ = number of clusters.
