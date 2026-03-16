Sovereign Memory v2.0 — Core Mathematics & Algorithms
Table of Contents
Hebbian Memory Graph Dynamics
Salience Decay & Memory Half-Lives
Multi-Signal Retrieval Scoring
Dream Engine: Consolidation
Dream Engine: Pattern Discovery & Community Detection
Dream Engine: Contradiction Detection
Dream Engine: Analogy Discovery
Anticipatory Retrieval
Cognitive Twin: Knowledge State Estimation
Cognitive Twin: Decision Modeling
Temporal Commitments & Zero-Knowledge Proofs
Ontological Lensing: Graph Projections
Memory Compression with Fidelity Bounds
Counterfactual Simulation
1. Hebbian Memory Graph Dynamics
1.1 Formal Model
The memory graph is a weighted directed multigraph:

G
=
(
V
,
E
,
w
,
τ
,
λ
)
G=(V,E,w,τ,λ)

where:

V
=
{
m
1
,
m
2
,
…
,
m
n
}
V={m 
1
​
 ,m 
2
​
 ,…,m 
n
​
 } is the set of memory nodes
E
⊆
V
×
V
×
T
E⊆V×V×T is the edge set with edge types 
T
T
w
:
E
×
R
+
→
[
0
,
1
]
w:E×R 
+
 →[0,1] is the time-dependent weight function
τ
:
E
→
R
+
τ:E→R 
+
  records the last activation time
λ
:
E
→
R
+
λ:E→R 
+
  is the per-edge decay rate
Edge types 
T
=
{
causal
,
temporal
,
semantic
,
contradictory
,
hierarchical
,
analogical
,
procedural
,
emotional
}
T={causal,temporal,semantic,contradictory,hierarchical,analogical,procedural,emotional}.

1.2 Hebbian Weight Update Rule
For edge 
e
i
j
k
e 
ij
k
​
  connecting memories 
m
i
,
m
j
m 
i
​
 ,m 
j
​
  with type 
k
k:

Decay (continuous):

w
(
e
,
t
)
=
w
0
(
e
)
⋅
exp
⁡
 ⁣
(
−
λ
(
e
)
⋅
(
t
−
τ
(
e
)
)
)
w(e,t)=w 
0
​
 (e)⋅exp(−λ(e)⋅(t−τ(e)))

where 
w
0
(
e
)
w 
0
​
 (e) is the weight at last activation and 
τ
(
e
)
τ(e) is the last activation time.

Co-activation (discrete event at time 
t
t):

When memories 
m
i
m 
i
​
  and 
m
j
m 
j
​
  are co-retrieved or co-referenced:

w
0
′
(
e
)
=
w
(
e
,
t
)
+
α
⋅
(
1
−
w
(
e
,
t
)
)
⋅
f
 ⁣
(
c
(
e
)
)
w 
0
′
​
 (e)=w(e,t)+α⋅(1−w(e,t))⋅f(c(e))

τ
′
(
e
)
=
t
τ 
′
 (e)=t

where:

α
∈
(
0
,
1
]
α∈(0,1] is the learning rate (default 
0.1
0.1)
f
(
c
)
=
1
−
e
−
β
c
f(c)=1−e 
−βc
  is a frequency modulation function
c
(
e
)
c(e) is the activation count
β
β controls frequency sensitivity (default 
0.05
0.05)
The term 
(
1
−
w
(
e
,
t
)
)
(1−w(e,t)) provides bounded growth — weights asymptotically approach 1 but never exceed it. The 
f
(
c
)
f(c) term causes frequently co-activated edges to strengthen faster.

Properties:

Bounded: 
w
(
e
,
t
)
∈
[
0
,
1
]
w(e,t)∈[0,1] for all 
t
t ✓
Monotone decay without input: 
∂
w
∂
t
=
−
λ
w
≤
0
∂t
∂w
​
 =−λw≤0 when no activation ✓
Diminishing returns: Each activation adds less as 
w
→
1
w→1 ✓
Frequency sensitivity: More co-activations → faster strengthening ✓
1.3 Adaptive Decay Rate
The decay rate itself adapts based on the reinforcement pattern:

λ
(
e
)
=
λ
base
⋅
(
1
1
+
γ
⋅
R
(
e
)
)
λ(e)=λ 
base
​
 ⋅( 
1+γ⋅R(e)
1
​
 )

where 
R
(
e
)
R(e) is the reinforcement regularity score:

R
(
e
)
=
1
σ
(
Δ
t
1
,
Δ
t
2
,
…
,
Δ
t
k
)
+
ϵ
R(e)= 
σ(Δt 
1
​
 ,Δt 
2
​
 ,…,Δt 
k
​
 )+ϵ
1
​
 

where 
Δ
t
i
Δt 
i
​
  are the inter-activation intervals. Regular reinforcement (low 
σ
σ) produces lower decay rates — memories reinforced on a schedule persist longer, mirroring biological spaced repetition.

1.4 Edge Pruning Criterion
An edge 
e
e is prunable at time 
t
t if:

w
(
e
,
t
)
<
θ
prune
∧
c
(
e
)
<
c
min
⁡
∧
(
t
−
τ
(
e
)
)
>
T
grace
w(e,t)<θ 
prune
​
 ∧c(e)<c 
min
​
 ∧(t−τ(e))>T 
grace
​
 

Default values: 
θ
prune
=
0.01
θ 
prune
​
 =0.01, 
c
min
⁡
=
3
c 
min
​
 =3, 
T
grace
=
30
T 
grace
​
 =30 days.

1.5 Algorithm: Hebbian Update Cycle
text

ALGORITHM HebbianUpdate(sessions, graph G)
────────────────────────────────────────────
Input:  sessions — list of recent retrieval sessions
        G = (V, E, w, τ, λ) — current memory graph
Output: G' — updated memory graph

1.  t_now ← CurrentTime()

2.  // Phase 1: Decay all edges
    FOR each edge e ∈ E:
        w(e) ← w₀(e) · exp(-λ(e) · (t_now - τ(e)))

3.  // Phase 2: Co-activation from sessions
    co_activations ← empty map: (V × V) → count
    FOR each session s ∈ sessions:
        retrieved ← s.retrieved_memories
        FOR each pair (mᵢ, mⱼ) ∈ retrieved × retrieved, i ≠ j:
            co_activations[(mᵢ, mⱼ)] += 1

4.  FOR each ((mᵢ, mⱼ), count) ∈ co_activations:
        // Determine edge type by analyzing content relationship
        k ← InferEdgeType(mᵢ, mⱼ)
        e ← GetOrCreateEdge(G, mᵢ, mⱼ, k)
        
        FOR r = 1 TO count:
            c(e) ← c(e) + 1
            f_c ← 1 - exp(-β · c(e))
            w(e) ← w(e) + α · (1 - w(e)) · f_c
        
        τ(e) ← t_now
        UpdateDecayRate(e)

5.  // Phase 3: Prune dead edges
    FOR each edge e ∈ E:
        IF w(e) < θ_prune AND c(e) < c_min AND (t_now - τ(e)) > T_grace:
            Remove e from E

6.  RETURN G
Complexity: 
O
(
∣
E
∣
+
S
⋅
k
2
)
O(∣E∣+S⋅k 
2
 ) where 
S
S is the number of sessions and 
k
k is the average memories retrieved per session.

2. Salience Decay & Memory Half-Lives
2.1 Salience Model
Each memory 
m
m has a salience score 
s
(
m
,
t
)
∈
[
0
,
1
]
s(m,t)∈[0,1] that governs storage tier placement and retrieval priority.

s
(
m
,
t
)
=
s
intrinsic
(
m
)
⋅
D
(
m
,
t
)
⋅
C
(
m
,
t
)
s(m,t)=s 
intrinsic
​
 (m)⋅D(m,t)⋅C(m,t)

where:

s
intrinsic
(
m
)
∈
[
0
,
1
]
s 
intrinsic
​
 (m)∈[0,1] is the base salience (set at creation, adjustable)
D
(
m
,
t
)
D(m,t) is the decay factor
C
(
m
,
t
)
C(m,t) is the connectivity boost
2.2 Decay Factor (Ebbinghaus-Inspired)
Using a power-law decay with reinforcement:

D
(
m
,
t
)
=
(
1
+
t
−
τ
last
(
m
)
S
(
m
)
)
−
ψ
D(m,t)=(1+ 
S(m)
t−τ 
last
​
 (m)
​
 ) 
−ψ
 

where:

τ
last
(
m
)
τ 
last
​
 (m) is the last access time
S
(
m
)
S(m) is the stability (how resistant to forgetting)
ψ
>
0
ψ>0 is the decay exponent (default 
0.5
0.5)
Stability grows with spaced reinforcement (following the SM-2/FSRS model):

S
′
(
m
)
=
S
(
m
)
⋅
(
1
+
e
d
w
⋅
S
(
m
)
−
d
s
⋅
(
e
d
r
⋅
R
(
m
,
t
)
−
1
)
)
S 
′
 (m)=S(m)⋅(1+e 
d 
w
​
 
 ⋅S(m) 
−d 
s
​
 
 ⋅(e 
d 
r
​
 ⋅R(m,t)
 −1))

where:

R
(
m
,
t
)
=
D
(
m
,
t
)
R(m,t)=D(m,t) is the retrievability at the moment of review
d
w
,
d
s
,
d
r
d 
w
​
 ,d 
s
​
 ,d 
r
​
  are learnable parameters (initialized from FSRS defaults)
This captures the key insight: retrieving a memory at the moment it's about to be forgotten strengthens it maximally.

2.3 Connectivity Boost
Memories connected to many high-salience memories inherit salience:

C
(
m
,
t
)
=
1
+
η
⋅
∑
e
=
(
m
,
m
′
)
∈
E
w
(
e
,
t
)
⋅
s
(
m
′
,
t
)
C(m,t)=1+η⋅∑ 
e=(m,m 
′
 )∈E
​
 w(e,t)⋅s(m 
′
 ,t)

This is recursive, so we compute via iteration to fixed point:

text

ALGORITHM ComputeSalience(G, params)
──────────────────────────────────────
Input:  G — memory graph with decay parameters
        params — {η, ψ, max_iterations, ε}
Output: s(m) for all m ∈ V

1.  t ← CurrentTime()

2.  // Initialize with intrinsic × decay
    FOR each m ∈ V:
        D(m) ← (1 + (t - τ_last(m)) / S(m))^(-ψ)
        s(m) ← s_intrinsic(m) · D(m)

3.  // Iterate connectivity boost to fixed point
    FOR iter = 1 TO max_iterations:
        s_prev ← copy of s
        FOR each m ∈ V:
            boost ← 1 + η · Σ_{(m,m')∈E} w((m,m'), t) · s_prev(m')
            s(m) ← s_intrinsic(m) · D(m) · min(boost, boost_cap)
        
        IF ‖s - s_prev‖_∞ < ε:
            BREAK

4.  // Normalize to [0, 1]
    s ← s / max(s)

5.  RETURN s
Convergence: Guaranteed if 
η
⋅
max
⁡
m
∑
(
m
,
m
′
)
w
(
e
,
t
)
<
1
η⋅max 
m
​
 ∑ 
(m,m 
′
 )
​
 w(e,t)<1 (spectral radius condition). Default 
η
=
0.1
η=0.1 ensures this for practical graphs.

Complexity: 
O
(
I
⋅
∣
E
∣
)
O(I⋅∣E∣) per iteration, typically 
I
≤
5
I≤5 iterations.

2.4 Storage Tier Assignment
\text{hot} & \text{if } s(m, t) \geq \theta_{\text{hot}} \\ \text{warm} & \text{if } \theta_{\text{warm}} \leq s(m, t) < \theta_{\text{hot}} \\ \text{cold} & \text{if } \theta_{\text{cold}} \leq s(m, t) < \theta_{\text{warm}} \\ \text{archive} & \text{if } s(m, t) < \theta_{\text{cold}} \end{cases}$$
Defaults: 
θ
hot
=
0.5
θ 
hot
​
 =0.5, 
θ
warm
=
0.15
θ 
warm
​
 =0.15, 
θ
cold
=
0.03
θ 
cold
​
 =0.03.

Tier transitions trigger index updates: hot/warm memories are fully indexed, cold memories have reduced indices, archive memories retain only CID + minimal metadata.

3. Multi-Signal Retrieval Scoring
3.1 Retrieval Score Function
Given a query 
q
q and candidate memory 
m
m, the retrieval score is:

score
(
q
,
m
)
=
∑
i
ϕ
i
(
q
)
⋅
r
i
(
q
,
m
)
score(q,m)=∑ 
i
​
 ϕ 
i
​
 (q)⋅r 
i
​
 (q,m)

where 
ϕ
i
(
q
)
ϕ 
i
​
 (q) are query-dependent weights and 
r
i
(
q
,
m
)
r 
i
​
 (q,m) are individual signal scores:

Signal 
r
i
r 
i
​
 	Definition	Range
r
sem
r 
sem
​
 	Cosine similarity of embeddings	
[
−
1
,
1
]
[−1,1]
r
kw
r 
kw
​
 	BM25 keyword score (normalized)	
[
0
,
1
]
[0,1]
r
sal
r 
sal
​
 	Current salience 
s
(
m
,
t
)
s(m,t)	
[
0
,
1
]
[0,1]
r
temp
r 
temp
​
 	Temporal relevance (see below)	
[
0
,
1
]
[0,1]
r
graph
r 
graph
​
 	Graph proximity to query context	
[
0
,
1
]
[0,1]
r
twin
r 
twin
​
 	Cognitive Twin predicted utility	
[
0
,
1
]
[0,1]
r
type
r 
type
​
 	Memory type match bonus	
{
0
,
1
}
{0,1}
3.2 Semantic Similarity
r
sem
(
q
,
m
)
=
e
q
⋅
e
m
∥
e
q
∥
⋅
∥
e
m
∥
r 
sem
​
 (q,m)= 
∥e 
q
​
 ∥⋅∥e 
m
​
 ∥
e 
q
​
 ⋅e 
m
​
 
​
 

where 
e
q
,
e
m
∈
R
d
e 
q
​
 ,e 
m
​
 ∈R 
d
  are embedding vectors. For multi-modal memories with multiple embeddings:

r
sem
(
q
,
m
)
=
max
⁡
j
∈
modalities
(
m
)
cos
(
e
q
,
e
m
(
j
)
)
r 
sem
​
 (q,m)=max 
j∈modalities(m)
​
 cos(e 
q
​
 ,e 
m
(j)
​
 )

Index: HNSW with 
M
=
16
M=16, 
e
f
construction
=
200
ef 
construction
​
 =200, 
e
f
search
=
100
ef 
search
​
 =100.

3.3 Temporal Relevance
Temporal relevance depends on the query's temporal intent:

For queries about a specific time period 
[
t
a
,
t
b
]
[t 
a
​
 ,t 
b
​
 ]:

1 & \text{if } t_{\text{event}}(m) \in [t_a, t_b] \\ \exp\!\left(-\frac{d(t_{\text{event}}(m), [t_a, t_b])^2}{2\sigma_t^2}\right) & \text{otherwise} \end{cases}$$
where 
d
(
t
,
[
a
,
b
]
)
=
min
⁡
(
∣
t
−
a
∣
,
∣
t
−
b
∣
)
d(t,[a,b])=min(∣t−a∣,∣t−b∣) is the distance from 
t
t to the interval and 
σ
t
σ 
t
​
  scales with the interval width.

For queries without temporal intent (recency bias):

r
temp
(
q
,
m
)
=
exp
⁡
 ⁣
(
−
t
now
−
t
event
(
m
)
τ
recency
)
r 
temp
​
 (q,m)=exp(− 
τ 
recency
​
 
t 
now
​
 −t 
event
​
 (m)
​
 )

with 
τ
recency
=
365
τ 
recency
​
 =365 days by default.

3.4 Graph Proximity Score
Given the set of memories currently in the active context 
A
A:

r
graph
(
q
,
m
)
=
max
⁡
a
∈
A
PathScore
(
a
,
m
)
r 
graph
​
 (q,m)=max 
a∈A
​
 PathScore(a,m)

PathScore
(
a
,
m
)
=
max
⁡
path 
P
:
a
⇝
m
∏
e
∈
P
w
(
e
,
t
)
PathScore(a,m)=max 
path P:a⇝m
​
 ∏ 
e∈P
​
 w(e,t)

Computing the max-product path is equivalent to a shortest path in 
−
log
⁡
w
−logw space:

text

ALGORITHM GraphProximity(G, active_set A, candidates C)
─────────────────────────────────────────────────────────
Input:  G — cognitive graph with weighted edges
        A — active context memories
        C — candidate memories for scoring
Output: proximity score for each c ∈ C

1.  // Transform to shortest-path problem
    FOR each edge e ∈ E:
        d(e) ← -log(w(e, t) + ε)   // ε prevents log(0)

2.  // Multi-source Dijkstra from all active memories
    dist ← Dijkstra(G_transformed, sources = A, max_depth = 4)

3.  FOR each c ∈ C:
        IF dist[c] = ∞:
            r_graph(c) ← 0
        ELSE:
            r_graph(c) ← exp(-dist[c])  // Convert back to [0, 1]

4.  RETURN r_graph
Complexity: 
O
(
(
∣
V
∣
+
∣
E
∣
)
log
⁡
∣
V
∣
)
O((∣V∣+∣E∣)log∣V∣) per query, amortized across candidates.

3.5 Query-Adaptive Weights
The weights 
ϕ
i
(
q
)
ϕ 
i
​
 (q) are learned from user feedback (clicks, explicit ratings, implicit dwell time):

ϕ
i
(
q
)
=
ϕ
i
base
+
Δ
ϕ
i
(
q
)
ϕ 
i
​
 (q)=ϕ 
i
base
​
 +Δϕ 
i
​
 (q)

where 
ϕ
i
base
ϕ 
i
base
​
  are global defaults and 
Δ
ϕ
i
(
q
)
Δϕ 
i
​
 (q) are adjustments based on query classification:

Query Class	
ϕ
sem
ϕ 
sem
​
 	
ϕ
kw
ϕ 
kw
​
 	
ϕ
sal
ϕ 
sal
​
 	
ϕ
temp
ϕ 
temp
​
 	
ϕ
graph
ϕ 
graph
​
 	
ϕ
twin
ϕ 
twin
​
 
Fact lookup	0.4	0.3	0.05	0.05	0.1	0.1
Temporal ("last month")	0.2	0.15	0.05	0.4	0.1	0.1
Relational ("about Alice")	0.25	0.2	0.05	0.1	0.3	0.1
Exploratory	0.3	0.1	0.15	0.05	0.15	0.25
Decision support	0.2	0.1	0.1	0.1	0.15	0.35
Weights are updated via online gradient descent on retrieval quality:

ϕ
i
(
t
+
1
)
=
ϕ
i
(
t
)
+
η
ϕ
⋅
(
relevance
(
m
selected
)
−
relevance
(
m
top
)
)
⋅
r
i
(
q
,
m
selected
)
ϕ 
i
(t+1)
​
 =ϕ 
i
(t)
​
 +η 
ϕ
​
 ⋅(relevance(m 
selected
​
 )−relevance(m 
top
​
 ))⋅r 
i
​
 (q,m 
selected
​
 )

3.6 Complete Retrieval Algorithm
text

ALGORITHM RetrieveMemories(query q, context A, graph G, twin T)
──────────────────────────────────────────────────────────────────
Input:  q — user query (text + metadata)
        A — active context memories
        G — cognitive graph
        T — cognitive twin model
Output: ranked list of memories

1.  // Query analysis
    q_class ← ClassifyQuery(q)
    q_temporal ← ExtractTemporalIntent(q)
    q_entities ← ExtractEntities(q)
    φ ← GetWeights(q_class)

2.  // Multi-index candidate retrieval (parallel)
    C_sem ← SemanticIndex.search(embed(q), top_k = 200)
    C_kw  ← KeywordIndex.search(q.text, top_k = 100)
    C_temp ← TemporalIndex.range(q_temporal, limit = 100) IF q_temporal
    C_ent ← EntityIndex.search(q_entities, top_k = 50)  IF q_entities
    C_graph ← GraphNeighbors(A, depth = 2, limit = 50)
    C_pred ← Twin.predict_relevant(q, top_k = 50)
    
    C ← C_sem ∪ C_kw ∪ C_temp ∪ C_ent ∪ C_graph ∪ C_pred  // Deduplicate

3.  // Score all candidates
    FOR each m ∈ C:
        r_sem  ← CosineSimilarity(embed(q), embed(m))
        r_kw   ← BM25Normalized(q.text, m.text)
        r_sal  ← Salience(m, t_now)
        r_temp ← TemporalRelevance(q_temporal, m.temporal)
        r_graph ← GraphProximity(G, A, m)
        r_twin ← Twin.predict_utility(q, m)
        r_type ← TypeMatch(q_class, m.type)
        
        score(m) ← Σᵢ φᵢ · rᵢ

4.  // Diversity re-ranking (MMR)
    results ← MaximalMarginalRelevance(C, scores, λ_diversity = 0.3, k = 20)

5.  // Update Hebbian edges for co-retrieval
    ScheduleHebbianUpdate(results)

6.  RETURN results
3.7 Maximal Marginal Relevance (MMR)
To avoid returning redundant memories:

MMR
(
m
)
=
λ
⋅
score
(
q
,
m
)
−
(
1
−
λ
)
⋅
max
⁡
m
′
∈
S
sim
(
m
,
m
′
)
MMR(m)=λ⋅score(q,m)−(1−λ)⋅max 
m 
′
 ∈S
​
 sim(m,m 
′
 )

where 
S
S is the set of already-selected results.

text

ALGORITHM MMR(candidates C, scores, λ, k)
──────────────────────────────────────────
1.  S ← ∅
2.  FOR i = 1 TO k:
        m* ← argmax_{m ∈ C\S} [λ · score(m) - (1-λ) · max_{m'∈S} sim(m, m')]
        S ← S ∪ {m*}
3.  RETURN S
Complexity: 
O
(
k
⋅
∣
C
∣
)
O(k⋅∣C∣).

4. Dream Engine: Consolidation
4.1 Near-Duplicate Detection via LSH
Goal: Find memory pairs with cosine similarity 
>
θ
dup
>θ 
dup
​
  (default 
0.92
0.92).

Using SimHash (random hyperplane LSH):

For each memory embedding 
e
∈
R
d
e∈R 
d
 , compute 
b
b hash signatures using 
L
L independent hash tables:

h
i
(
e
)
=
sign
(
r
i
⋅
e
)
h 
i
​
 (e)=sign(r 
i
​
 ⋅e)

where 
r
i
r 
i
​
  are random unit vectors. The probability that two vectors hash to the same bucket:

P
[
h
i
(
e
1
)
=
h
i
(
e
2
)
]
=
1
−
cos
⁡
−
1
(
sim
(
e
1
,
e
2
)
)
π
P[h 
i
​
 (e 
1
​
 )=h 
i
​
 (e 
2
​
 )]=1− 
π
cos 
−1
 (sim(e 
1
​
 ,e 
2
​
 ))
​
 

For 
b
b-bit signatures across 
L
L tables, a pair is a candidate if they match in 
≥
b
⋅
p
min
⁡
≥b⋅p 
min
​
  bits in any table.

text

ALGORITHM FindNearDuplicates(memories M, θ_dup)
─────────────────────────────────────────────────
Parameters: L = 20 tables, b = 128 bits per signature

1.  // Build LSH signatures
    FOR each m ∈ M:
        FOR l = 1 TO L:
            sig_l(m) ← SimHash(embed(m), random_vectors_l, b)

2.  // Find candidates (bucket collisions)
    candidates ← ∅
    FOR l = 1 TO L:
        buckets ← GroupBySignature(sig_l, band_size = b/4)
        FOR each bucket B with |B| ≥ 2:
            FOR each pair (mᵢ, mⱼ) ∈ B:
                candidates ← candidates ∪ {(mᵢ, mⱼ)}

3.  // Verify candidates with exact cosine similarity
    duplicates ← ∅
    FOR each (mᵢ, mⱼ) ∈ candidates:
        sim ← CosineSimilarity(embed(mᵢ), embed(mⱼ))
        IF sim ≥ θ_dup:
            duplicates ← duplicates ∪ {(mᵢ, mⱼ, sim)}

4.  RETURN duplicates
Complexity: 
O
(
n
⋅
L
⋅
b
)
O(n⋅L⋅b) for signature computation, 
O
(
n
⋅
L
/
2
b
/
bands
)
O(n⋅L/2 
b/bands
 ) expected candidates.

4.2 Merge Strategy
When two memories 
m
1
,
m
2
m 
1
​
 ,m 
2
​
  are near-duplicates:

Merge scoring — decide whether to merge:

MergeScore
(
m
1
,
m
2
)
=
α
s
⋅
sim
(
m
1
,
m
2
)
+
α
r
⋅
RedundancyRatio
(
m
1
,
m
2
)
−
α
u
⋅
UniqueInfo
(
m
1
,
m
2
)
MergeScore(m 
1
​
 ,m 
2
​
 )=α 
s
​
 ⋅sim(m 
1
​
 ,m 
2
​
 )+α 
r
​
 ⋅RedundancyRatio(m 
1
​
 ,m 
2
​
 )−α 
u
​
 ⋅UniqueInfo(m 
1
​
 ,m 
2
​
 )

where:

RedundancyRatio
(
m
1
,
m
2
)
=
∣
tokens
(
m
1
)
∩
tokens
(
m
2
)
∣
∣
tokens
(
m
1
)
∪
tokens
(
m
2
)
∣
RedundancyRatio(m 
1
​
 ,m 
2
​
 )= 
∣tokens(m 
1
​
 )∪tokens(m 
2
​
 )∣
∣tokens(m 
1
​
 )∩tokens(m 
2
​
 )∣
​
 

UniqueInfo
(
m
1
,
m
2
)
=
1
−
∣
entities
(
m
1
)
∩
entities
(
m
2
)
∣
∣
entities
(
m
1
)
∪
entities
(
m
2
)
∣
UniqueInfo(m 
1
​
 ,m 
2
​
 )=1− 
∣entities(m 
1
​
 )∪entities(m 
2
​
 )∣
∣entities(m 
1
​
 )∩entities(m 
2
​
 )∣
​
 

Merge if 
MergeScore
>
θ
merge
MergeScore>θ 
merge
​
  (default 
0.7
0.7).

Merged memory construction:

m
merged
=
LLM_Consolidate
(
m
1
,
m
2
,
instructions
)
m 
merged
​
 =LLM_Consolidate(m 
1
​
 ,m 
2
​
 ,instructions)

with provenance: 
provenance
(
m
merged
)
=
[
m
1
.
cid
,
m
2
.
cid
,
“merge”
,
t
now
]
provenance(m 
merged
​
 )=[m 
1
​
 .cid,m 
2
​
 .cid,“merge”,t 
now
​
 ]

Merged memory inherits:

s
intrinsic
(
m
merged
)
=
max
⁡
(
s
intrinsic
(
m
1
)
,
s
intrinsic
(
m
2
)
)
s 
intrinsic
​
 (m 
merged
​
 )=max(s 
intrinsic
​
 (m 
1
​
 ),s 
intrinsic
​
 (m 
2
​
 ))
S
(
m
merged
)
=
max
⁡
(
S
(
m
1
)
,
S
(
m
2
)
)
S(m 
merged
​
 )=max(S(m 
1
​
 ),S(m 
2
​
 ))
All edges from both source memories (union)
The higher confidence value
5. Dream Engine: Pattern Discovery & Community Detection
5.1 Temporal Louvain Algorithm
Community detection adapted for the cognitive graph with temporal edge weights.

Objective: Maximize temporal modularity:

Q
t
=
1
2
W
∑
i
j
[
w
eff
(
e
i
j
,
t
)
−
k
i
⋅
k
j
2
W
]
δ
(
c
i
,
c
j
)
Q 
t
​
 = 
2W
1
​
 ∑ 
ij
​
 [w 
eff
​
 (e 
ij
​
 ,t)− 
2W
k 
i
​
 ⋅k 
j
​
 
​
 ]δ(c 
i
​
 ,c 
j
​
 )

where:

w
eff
(
e
i
j
,
t
)
=
w
(
e
i
j
,
t
)
⋅
type_weight
(
e
i
j
.
type
)
w 
eff
​
 (e 
ij
​
 ,t)=w(e 
ij
​
 ,t)⋅type_weight(e 
ij
​
 .type) is the effective edge weight at time 
t
t
k
i
=
∑
j
w
eff
(
e
i
j
,
t
)
k 
i
​
 =∑ 
j
​
 w 
eff
​
 (e 
ij
​
 ,t) is the weighted degree of node 
i
i
W
=
1
2
∑
i
j
w
eff
(
e
i
j
,
t
)
W= 
2
1
​
 ∑ 
ij
​
 w 
eff
​
 (e 
ij
​
 ,t) is the total weight
c
i
c 
i
​
  is the community assignment of node 
i
i
δ
δ is the Kronecker delta
Type weights (configurable):

Edge Type	Default Weight
Causal	1.5
Semantic	1.0
Temporal (close)	0.8
Hierarchical	1.2
Analogical	0.6
Emotional	0.7
Contradictory	0.3
Procedural	1.0
text

ALGORITHM TemporalLouvain(G, t, type_weights)
──────────────────────────────────────────────
Input:  G — cognitive graph
        t — current time (for edge decay)
        type_weights — weights per edge type
Output: community assignments, hierarchical structure

1.  // Compute effective weights
    FOR each edge e ∈ E:
        w_eff(e) ← w(e, t) · type_weights[e.type]
    
    W ← ½ · Σ_e w_eff(e)

2.  // Phase 1: Local modularity optimization
    c ← {each node in its own community}
    improved ← TRUE
    
    WHILE improved:
        improved ← FALSE
        FOR each node i in random order:
            best_community ← c[i]
            best_ΔQ ← 0
            
            FOR each neighbor community c' of i:
                ΔQ ← ModularityGain(i, c', G, w_eff, W)
                IF ΔQ > best_ΔQ:
                    best_ΔQ ← ΔQ
                    best_community ← c'
            
            IF best_community ≠ c[i]:
                c[i] ← best_community
                improved ← TRUE

3.  // Phase 2: Aggregate and repeat
    G' ← AggregateGraph(G, c)
    IF |V(G')| < |V(G)|:
        c' ← TemporalLouvain(G', t, type_weights)
        c ← ComposeCommunities(c, c')

4.  RETURN c
Modularity gain for moving node 
i
i to community 
C
C:

Δ
Q
=
k
i
,
in
C
W
−
k
i
⋅
Σ
C
2
W
2
ΔQ= 
W
k 
i,in
C
​
 
​
 − 
2W 
2
 
k 
i
​
 ⋅Σ 
C
​
 
​
 

where 
k
i
,
in
C
=
∑
j
∈
C
w
eff
(
e
i
j
)
k 
i,in
C
​
 =∑ 
j∈C
​
 w 
eff
​
 (e 
ij
​
 ) and 
Σ
C
=
∑
j
∈
C
k
j
Σ 
C
​
 =∑ 
j∈C
​
 k 
j
​
 .

Complexity: 
O
(
∣
E
∣
⋅
iterations
)
O(∣E∣⋅iterations), typically near-linear in practice.

5.2 Bridge Memory Detection
Bridge memories connect otherwise separate clusters:

Bridgeness
(
m
)
=
1
−
∑
C
(
k
m
C
k
m
)
2
1
Bridgeness(m)=1− 
1
∑ 
C
​
 ( 
k 
m
​
 
k 
m
C
​
 
​
 ) 
2
 
​
 

where 
k
m
C
k 
m
C
​
  is the weighted degree of 
m
m to community 
C
C and 
k
m
k 
m
​
  is the total weighted degree. This is the complement of the Herfindahl index of 
m
m's community connections.

Bridgeness
≈
0
Bridgeness≈0: all connections in one community (not a bridge).
Bridgeness
≈
1
Bridgeness≈1: connections evenly distributed across many communities (strong bridge).

Alternatively using betweenness centrality (more expensive but more precise):

BetweennessCentrality
(
m
)
=
∑
s
≠
m
≠
t
σ
s
t
(
m
)
σ
s
t
BetweennessCentrality(m)=∑ 
s

=m

=t
​
  
σ 
st
​
 
σ 
st
​
 (m)
​
 

where 
σ
s
t
σ 
st
​
  is the number of shortest paths from 
s
s to 
t
t and 
σ
s
t
(
m
)
σ 
st
​
 (m) is the number passing through 
m
m.

Complexity: 
O
(
∣
V
∣
⋅
∣
E
∣
)
O(∣V∣⋅∣E∣) for exact betweenness. Use approximate betweenness via sampling for large graphs.

5.3 Cluster Labeling
Each community 
C
C is labeled by extracting the top concepts:

Label
(
C
)
=
TopK
(
⋃
m
∈
C
concepts
(
m
)
,
 scored by TF-IDF
(
c
,
C
,
C
)
)
Label(C)=TopK(⋃ 
m∈C
​
 concepts(m), scored by TF-IDF(c,C,C))

where 
TF-IDF
(
c
,
C
,
C
)
TF-IDF(c,C,C) measures concept 
c
c's frequency in 
C
C relative to all communities 
C
C.

6. Dream Engine: Contradiction Detection
6.1 Belief Extraction and Representation
Memories are analyzed to extract propositional beliefs:

beliefs
(
m
)
=
{
(
s
,
p
,
o
,
conf
,
t
m
)
}
beliefs(m)={(s,p,o,conf,t 
m
​
 )}

where 
(
s
,
p
,
o
)
(s,p,o) is a subject-predicate-object triple, 
conf
conf is the confidence, and 
t
m
t 
m
​
  is the memory timestamp.

Example: "Alice prefers Python" → (Alice, prefers, Python, 0.9, 2024-03-15).

6.2 Contradiction Score
For two beliefs 
b
1
=
(
s
1
,
p
1
,
o
1
,
c
1
,
t
1
)
b 
1
​
 =(s 
1
​
 ,p 
1
​
 ,o 
1
​
 ,c 
1
​
 ,t 
1
​
 ) and 
b
2
=
(
s
2
,
p
2
,
o
2
,
c
2
,
t
2
)
b 
2
​
 =(s 
2
​
 ,p 
2
​
 ,o 
2
​
 ,c 
2
​
 ,t 
2
​
 ):

Step 1: Subject-predicate alignment

align
(
b
1
,
b
2
)
=
sim
(
s
1
,
s
2
)
⋅
sim
(
p
1
,
p
2
)
align(b 
1
​
 ,b 
2
​
 )=sim(s 
1
​
 ,s 
2
​
 )⋅sim(p 
1
​
 ,p 
2
​
 )

If 
align
<
θ
align
align<θ 
align
​
  (default 
0.8
0.8), the beliefs aren't about the same thing → not contradictory.

Step 2: Object divergence

diverge
(
b
1
,
b
2
)
=
1
−
sim
(
o
1
,
o
2
)
diverge(b 
1
​
 ,b 
2
​
 )=1−sim(o 
1
​
 ,o 
2
​
 )

Step 3: Logical contradiction detection

Check for explicit negation patterns, mutually exclusive values, numerical contradictions:

1.0 & \text{if explicit negation detected} \\ 0.8 & \text{if mutually exclusive categories} \\ f(|v_1 - v_2| / \max(|v_1|, |v_2|)) & \text{if numerical comparison} \\ 0.0 & \text{otherwise} \end{cases}$$
Step 4: Contradiction score

contradiction
(
b
1
,
b
2
)
=
align
(
b
1
,
b
2
)
⋅
max
⁡
(
diverge
(
b
1
,
b
2
)
,
 logical
(
b
1
,
b
2
)
)
⋅
min
⁡
(
c
1
,
c
2
)
contradiction(b 
1
​
 ,b 
2
​
 )=align(b 
1
​
 ,b 
2
​
 )⋅max(diverge(b 
1
​
 ,b 
2
​
 ), logical(b 
1
​
 ,b 
2
​
 ))⋅min(c 
1
​
 ,c 
2
​
 )

The 
min
⁡
(
c
1
,
c
2
)
min(c 
1
​
 ,c 
2
​
 ) term ensures low-confidence beliefs don't trigger false contradictions.

6.3 Algorithm
text

ALGORITHM DetectContradictions(memories M, θ_contradiction)
────────────────────────────────────────────────────────────
Input:  M — set of memories
        θ_contradiction — minimum score to report (default 0.6)
Output: list of contradiction pairs with scores

1.  // Extract beliefs from all memories
    beliefs ← ∅
    FOR each m ∈ M:
        beliefs ← beliefs ∪ ExtractBeliefs(m)

2.  // Index beliefs by subject embedding for efficient pairing
    subject_index ← BuildHNSW({(b, embed(b.subject)) : b ∈ beliefs})

3.  // Find potentially contradicting pairs
    contradictions ← ∅
    FOR each b₁ ∈ beliefs:
        // Find beliefs with similar subjects
        candidates ← subject_index.search(embed(b₁.subject), top_k = 50)
        candidates ← filter(candidates, same_predicate_type(b₁))
        
        FOR each b₂ ∈ candidates, b₂ ≠ b₁:
            score ← ContradictionScore(b₁, b₂)
            IF score ≥ θ_contradiction:
                contradictions ← contradictions ∪ {(b₁, b₂, score)}

4.  // Temporal analysis: has the user evolved their position?
    FOR each (b₁, b₂, score) ∈ contradictions:
        IF |b₁.time - b₂.time| > T_evolution:
            // Likely belief evolution, not contradiction
            label ← "evolution"
        ELSE:
            label ← "contradiction"
        
        Annotate((b₁, b₂, score, label))

5.  RETURN contradictions sorted by score DESC
Complexity: 
O
(
∣
B
∣
⋅
k
)
O(∣B∣⋅k) where 
∣
B
∣
∣B∣ is the number of extracted beliefs and 
k
=
50
k=50 is the candidate set size.

7. Dream Engine: Analogy Discovery
7.1 Structural Similarity via Subgraph Matching
An analogy is a structural correspondence between two subgraphs in different domains.

Definition: An analogical mapping between subgraphs 
G
A
G 
A
​
  and 
G
B
G 
B
​
  is a bijection 
ϕ
:
V
(
G
A
)
→
V
(
G
B
)
ϕ:V(G 
A
​
 )→V(G 
B
​
 ) such that the edge structures are preserved:

StructuralSim
(
ϕ
)
=
∣
{
(
u
,
v
,
k
)
∈
E
(
G
A
)
:
(
ϕ
(
u
)
,
ϕ
(
v
)
,
k
)
∈
E
(
G
B
)
}
∣
∣
E
(
G
A
)
∣
StructuralSim(ϕ)= 
∣E(G 
A
​
 )∣
∣{(u,v,k)∈E(G 
A
​
 ):(ϕ(u),ϕ(v),k)∈E(G 
B
​
 )}∣
​
 

7.2 Practical Algorithm (Approximate)
Full subgraph isomorphism is NP-complete. We use a graph kernel approach:

Weisfeiler-Leman (WL) Subtree Kernel adapted for typed, weighted edges:

text

ALGORITHM WLSubtreeKernel(G₁, G₂, iterations h)
──────────────────────────────────────────────────
Input:  G₁, G₂ — two subgraphs from different domains
        h — number of WL iterations (default 3)
Output: structural similarity score ∈ [0, 1]

1.  // Initialize node labels from memory types
    FOR each node v in G₁ ∪ G₂:
        label⁰(v) ← MemoryType(v)

2.  // Iterative relabeling
    FOR i = 1 TO h:
        FOR each node v:
            // Multiset of neighbor labels with edge types
            neighbor_labels ← sorted({(labelⁱ⁻¹(u), type(e_vu)) : (v,u) ∈ E})
            labelⁱ(v) ← Hash(labelⁱ⁻¹(v), neighbor_labels)

3.  // Build feature vectors (label histograms)
    φ(G₁) ← histogram of all labels at all iterations for G₁
    φ(G₂) ← histogram of all labels at all iterations for G₂

4.  // Normalized kernel value
    similarity ← φ(G₁) · φ(G₂) / (‖φ(G₁)‖ · ‖φ(G₂)‖)

5.  RETURN similarity
7.3 Domain Clustering for Candidate Generation
Comparing all pairs of subgraphs is infeasible. First cluster memories by domain, then compare structural motifs across domains:

text

ALGORITHM DiscoverAnalogies(G, communities C, θ_analogy)
──────────────────────────────────────────────────────────
Input:  G — cognitive graph
        C — community assignments from Louvain
        θ_analogy — minimum structural similarity (default 0.7)
Output: analogical mappings

1.  // Extract structural motifs for each community
    motifs ← ∅
    FOR each community c ∈ C:
        subgraph ← InduceSubgraph(G, c)
        // Extract frequent subgraph patterns (size 3-6 nodes)
        patterns ← gSpan(subgraph, min_support = 3, max_size = 6)
        motifs[c] ← patterns

2.  // Cross-domain comparison
    analogies ← ∅
    FOR each pair of communities (cᵢ, cⱼ), i < j:
        IF Domain(cᵢ) = Domain(cⱼ):
            CONTINUE  // Skip within-domain comparisons
        
        FOR each (pᵢ, pⱼ) ∈ motifs[cᵢ] × motifs[cⱼ]:
            sim ← WLSubtreeKernel(pᵢ, pⱼ, h = 3)
            IF sim ≥ θ_analogy:
                // Find the concrete node mapping
                mapping ← AlignNodes(pᵢ, pⱼ)
                analogies ← analogies ∪ {(cᵢ, cⱼ, pᵢ, pⱼ, mapping, sim)}

3.  RETURN analogies sorted by sim DESC
Node alignment uses the Hungarian algorithm on a cost matrix:

Cost
(
u
,
v
)
=
1
−
sim
(
role
(
u
,
G
A
)
,
role
(
v
,
G
B
)
)
Cost(u,v)=1−sim(role(u,G 
A
​
 ),role(v,G 
B
​
 ))

where 
role
(
u
,
G
)
role(u,G) is a vector of structural features: degree, edge type distribution, centrality.

Complexity: 
O
(
∣
C
∣
2
⋅
P
2
⋅
n
3
)
O(∣C∣ 
2
 ⋅P 
2
 ⋅n 
3
 ) where 
P
P is the number of patterns per community and 
n
n is the pattern size. Pruned by domain dissimilarity and pattern size matching.

8. Anticipatory Retrieval
8.1 Problem Formulation
Predict which memories the user will need at time 
t
+
Δ
t
t+Δt given:

Current context 
A
A (active memories)
Calendar events 
E
E
Periodic patterns 
P
P
Cognitive Twin predictions 
T
T
8.2 Temporal Need Prediction
Periodic pattern detection using autocorrelation:

For each memory 
m
m, compute the access time series 
x
m
(
t
)
x 
m
​
 (t) (1 if accessed at time 
t
t, 0 otherwise), then:

R
m
(
τ
)
=
∑
t
x
m
(
t
)
⋅
x
m
(
t
+
τ
)
∑
t
x
m
(
t
)
R 
m
​
 (τ)= 
∑ 
t
​
 x 
m
​
 (t)
∑ 
t
​
 x 
m
​
 (t)⋅x 
m
​
 (t+τ)
​
 

Peaks in 
R
m
(
τ
)
R 
m
​
 (τ) indicate periodic access patterns. A memory accessed every Monday morning will show 
R
(
τ
)
R(τ) peaks at 
τ
=
7
,
14
,
21
,
…
τ=7,14,21,… days.

text

ALGORITHM DetectPeriodicPatterns(access_history, min_occurrences)
─────────────────────────────────────────────────────────────────
Input:  access_history — {memory_id → [access_timestamps]}
Output: periodic patterns {memory_id → [(period, phase, confidence)]}

1.  patterns ← ∅

2.  FOR each memory m with |accesses(m)| ≥ min_occurrences:
        // Compute inter-access intervals
        intervals ← [t_{i+1} - t_i for consecutive accesses of m]
        
        IF |intervals| < 3:
            CONTINUE
        
        // Test for periodicity at candidate periods
        candidate_periods ← {1h, 1d, 7d, 14d, 30d, 90d, 365d}
        
        FOR each period p ∈ candidate_periods:
            // How many intervals are close to a multiple of p?
            hits ← |{Δt ∈ intervals : min_k |Δt - k·p| < p/4}|
            confidence ← hits / |intervals|
            
            IF confidence ≥ 0.6:
                // Estimate phase (time within period of typical access)
                phase ← CircularMean({t mod p : t ∈ accesses(m)})
                patterns[m] ← patterns[m] ∪ {(p, phase, confidence)}

3.  RETURN patterns
8.3 Calendar-Based Prediction
Match upcoming calendar events to relevant past contexts:

EventRelevance
(
m
,
e
)
=
sim
(
e
m
,
e
event_desc
)
⋅
PersonOverlap
(
m
,
e
)
⋅
TopicOverlap
(
m
,
e
)
EventRelevance(m,e)=sim(e 
m
​
 ,e 
event_desc
​
 )⋅PersonOverlap(m,e)⋅TopicOverlap(m,e)

where:

PersonOverlap
PersonOverlap counts shared entities
TopicOverlap
TopicOverlap counts shared topics
8.4 Combined Anticipatory Score
AnticScore
(
m
,
t
+
Δ
t
)
=
∑
j
μ
j
⋅
P
j
(
m
,
t
+
Δ
t
)
AnticScore(m,t+Δt)=∑ 
j
​
 μ 
j
​
 ⋅P 
j
​
 (m,t+Δt)

where:

P
periodic
P 
periodic
​
 : periodic pattern prediction
P
calendar
P 
calendar
​
 : calendar event relevance
P
context
P 
context
​
 : graph neighbors of currently active memories
P
twin
P 
twin
​
 : Cognitive Twin's prediction based on behavioral model
text

ALGORITHM AnticipatoryPreload(G, calendar, patterns, twin, horizon)
────────────────────────────────────────────────────────────────────
Input:  G — cognitive graph
        calendar — upcoming events within horizon
        patterns — periodic access patterns
        twin — cognitive twin
        horizon — lookahead window (default 24 hours)
Output: memories to preload to hot tier

1.  candidates ← ∅

2.  // Periodic pattern predictions
    FOR each (m, period, phase, conf) ∈ patterns:
        next_expected ← NextOccurrence(period, phase, t_now)
        IF next_expected ≤ t_now + horizon:
            candidates[m] += μ_periodic · conf

3.  // Calendar-based predictions
    FOR each event e ∈ calendar within horizon:
        relevant ← TopK(memories, EventRelevance(·, e), k = 20)
        FOR each (m, rel) ∈ relevant:
            candidates[m] += μ_calendar · rel

4.  // Context-based spreading activation
    FOR each m ∈ ActiveContext:
        FOR each (m, m', e) ∈ Edges(G):
            IF w(e, t_now) > 0.3:
                candidates[m'] += μ_context · w(e, t_now) · Salience(m')

5.  // Cognitive Twin prediction
    twin_predictions ← twin.predict_needs(t_now, t_now + horizon)
    FOR each (m, conf) ∈ twin_predictions:
        candidates[m] += μ_twin · conf

6.  // Preload top candidates
    preload_list ← TopK(candidates, k = 50)
    FOR each m ∈ preload_list:
        MoveToHotTier(m)

7.  RETURN preload_list
9. Cognitive Twin: Knowledge State Estimation
9.1 Knowledge as a Probabilistic Graph
The user's knowledge state is modeled as a probabilistic graph:

K
=
(
D
,
E
K
,
p
,
σ
)
K=(D,E 
K
​
 ,p,σ)

where:

D
=
{
d
1
,
…
,
d
n
}
D={d 
1
​
 ,…,d 
n
​
 } is a set of knowledge domains/concepts
E
K
⊆
D
×
D
E 
K
​
 ⊆D×D are dependency/prerequisite relationships
p
:
D
→
[
0
,
1
]
p:D→[0,1] is the proficiency function
σ
:
D
→
[
0
,
1
]
σ:D→[0,1] is the confidence in the proficiency estimate
9.2 Proficiency Estimation via Bayesian Knowledge Tracing
For each domain 
d
d, we maintain a belief distribution 
P
(
mastery
d
∣
evidence
)
P(mastery 
d
​
 ∣evidence).

Binary Knowledge Tracing (BKT) foundation:

P
(
L
t
∣
obs
t
)
∝
P
(
obs
t
∣
L
t
)
⋅
P
(
L
t
∣
L
t
−
1
)
P(L 
t
​
 ∣obs 
t
​
 )∝P(obs 
t
​
 ∣L 
t
​
 )⋅P(L 
t
​
 ∣L 
t−1
​
 )

with parameters:

P
(
L
0
)
P(L 
0
​
 ): prior probability of knowing 
d
d
P
(
T
)
P(T): probability of learning 
d
d per exposure
P
(
G
)
P(G): probability of demonstrating knowledge without having it (guessing)
P
(
S
)
P(S): probability of failing to demonstrate despite having knowledge (slipping)
Update on evidence (memory demonstrating knowledge of 
d
d):

P
(
L
t
=
1
∣
correct
)
=
P
(
L
t
=
1
)
⋅
(
1
−
P
(
S
)
)
P
(
L
t
=
1
)
⋅
(
1
−
P
(
S
)
)
+
(
1
−
P
(
L
t
=
1
)
)
⋅
P
(
G
)
P(L 
t
​
 =1∣correct)= 
P(L 
t
​
 =1)⋅(1−P(S))+(1−P(L 
t
​
 =1))⋅P(G)
P(L 
t
​
 =1)⋅(1−P(S))
​
 

P
(
L
t
=
1
∣
incorrect
)
=
P
(
L
t
=
1
)
⋅
P
(
S
)
P
(
L
t
=
1
)
⋅
P
(
S
)
+
(
1
−
P
(
L
t
=
1
)
)
⋅
(
1
−
P
(
G
)
)
P(L 
t
​
 =1∣incorrect)= 
P(L 
t
​
 =1)⋅P(S)+(1−P(L 
t
​
 =1))⋅(1−P(G))
P(L 
t
​
 =1)⋅P(S)
​
 

After evidence, apply learning transition:

P
(
L
t
+
1
=
1
)
=
P
(
L
t
=
1
∣
obs
)
+
(
1
−
P
(
L
t
=
1
∣
obs
)
)
⋅
P
(
T
)
P(L 
t+1
​
 =1)=P(L 
t
​
 =1∣obs)+(1−P(L 
t
​
 =1∣obs))⋅P(T)

9.3 Extended Model: Continuous Proficiency with Decay
Replace binary mastery with continuous proficiency 
p
d
(
t
)
∈
[
0
,
1
]
p 
d
​
 (t)∈[0,1]:

p
d
(
t
)
=
p
d
(
t
last
)
⋅
exp
⁡
 ⁣
(
−
t
−
t
last
τ
d
)
+
Δ
p
d
p 
d
​
 (t)=p 
d
​
 (t 
last
​
 )⋅exp(− 
τ 
d
​
 
t−t 
last
​
 
​
 )+Δp 
d
​
 

where:

τ
d
τ 
d
​
  is the domain-specific retention time constant
Δ
p
d
Δp 
d
​
  is the increment from new evidence
Evidence increment:

Δ
p
d
=
α
K
⋅
(
1
−
p
d
)
⋅
evidence_strength
(
e
)
Δp 
d
​
 =α 
K
​
 ⋅(1−p 
d
​
 )⋅evidence_strength(e)

Evidence strength depends on the type of memory demonstrating knowledge:

Evidence Type	Strength
User teaches someone	0.9
User applies in novel context	0.8
User explains concept	0.7
User references with correct detail	0.5
User mentions topic	0.2
System infers from related knowledge	0.1
9.4 Knowledge Gap Detection
A gap exists when:

\text{prerequisite gap} & \text{if } \exists d' \in \text{prereqs}(d) : p_{d'} < \theta_{\text{prereq}} \text{ and } p_d \geq \theta_{\text{active}} \\ \text{curiosity gap} & \text{if queries mentioning } d \text{ exceed } \theta_{\text{curiosity}} \text{ and } p_d < \theta_{\text{novice}} \\ \text{decay gap} & \text{if } p_d^{\text{peak}} - p_d(t) > \theta_{\text{decay\_gap}} \\ \text{boundary gap} & \text{if } p_d \geq \theta_{\text{intermediate}} \text{ and } p_{d'}^{\text{related}} \approx 0 \text{ for many related } d' \end{cases}$$
text

ALGORITHM DetectKnowledgeGaps(K, query_history)
────────────────────────────────────────────────
Input:  K — knowledge graph with proficiency estimates
        query_history — recent queries and their topics
Output: ranked list of knowledge gaps

1.  gaps ← ∅

2.  // Prerequisite gaps
    FOR each domain d with p(d) ≥ θ_active:
        FOR each prerequisite d' of d:
            IF p(d') < θ_prereq:
                gaps ← gaps ∪ {PrerequisiteGap(d, d', priority = p(d) - p(d'))}

3.  // Curiosity gaps
    topic_counts ← CountTopicsIn(query_history, window = 30 days)
    FOR each topic d with count(d) ≥ θ_curiosity:
        IF p(d) < θ_novice:
            gaps ← gaps ∪ {CuriosityGap(d, interest = count(d), proficiency = p(d))}

4.  // Decay gaps
    FOR each domain d:
        IF p_peak(d) - p(d, t_now) > θ_decay_gap:
            gaps ← gaps ∪ {DecayGap(d, peak = p_peak(d), current = p(d, t_now))}

5.  // Boundary gaps  
    FOR each domain d with p(d) ≥ θ_intermediate:
        related ← RelatedDomains(d, K)
        unknown_related ← {d' ∈ related : p(d') < θ_novice}
        IF |unknown_related| / |related| > 0.5:
            gaps ← gaps ∪ {BoundaryGap(d, unknown = unknown_related)}

6.  RETURN gaps sorted by priority DESC
10. Cognitive Twin: Decision Modeling
10.1 Decision Factor Analysis
The system maintains a model of what factors influence the user's decisions:

Decision
(
x
)
=
σ
 ⁣
(
∑
f
∈
F
w
f
⋅
v
f
(
x
)
+
b
)
Decision(x)=σ(∑ 
f∈F
​
 w 
f
​
 ⋅v 
f
​
 (x)+b)

where:

F
F is the set of identified decision factors
w
f
w 
f
​
  is the learned weight for factor 
f
f
v
f
(
x
)
v 
f
​
 (x) is the value of factor 
f
f in decision context 
x
x
σ
σ is the sigmoid function
Factors are extracted from decision memories:

F
=
{
cost
,
risk
,
novelty
,
alignment_with_values
,
social_approval
,
time_pressure
,
reversibility
,
…
}
F={cost,risk,novelty,alignment_with_values,social_approval,time_pressure,reversibility,…}

10.2 Learning Decision Weights
From observed decisions 
{
(
x
i
,
y
i
)
}
{(x 
i
​
 ,y 
i
​
 )} where 
y
i
∈
{
0
,
1
}
y 
i
​
 ∈{0,1} is the decision outcome:

Bayesian logistic regression:

Prior: 
w
f
∼
N
(
0
,
σ
w
2
)
w 
f
​
 ∼N(0,σ 
w
2
​
 )

Posterior update via Laplace approximation:

w
^
=
arg
⁡
max
⁡
w
[
∑
i
y
i
log
⁡
σ
(
w
T
v
i
)
+
(
1
−
y
i
)
log
⁡
(
1
−
σ
(
w
T
v
i
)
)
−
∥
w
∥
2
2
σ
w
2
]
w
^
 =argmax 
w
​
 [∑ 
i
​
 y 
i
​
 logσ(w 
T
 v 
i
​
 )+(1−y 
i
​
 )log(1−σ(w 
T
 v 
i
​
 ))− 
2σ 
w
2
​
 
∥w∥ 
2
 
​
 ]

Solved via iteratively reweighted least squares (IRLS):

w
(
t
+
1
)
=
(
V
T
S
(
t
)
V
+
1
σ
w
2
I
)
−
1
V
T
(
S
(
t
)
V
w
(
t
)
+
y
−
μ
(
t
)
)
w 
(t+1)
 =(V 
T
 S 
(t)
 V+ 
σ 
w
2
​
 
1
​
 I) 
−1
 V 
T
 (S 
(t)
 Vw 
(t)
 +y−μ 
(t)
 )

where 
S
(
t
)
=
diag
(
μ
i
(
t
)
(
1
−
μ
i
(
t
)
)
)
S 
(t)
 =diag(μ 
i
(t)
​
 (1−μ 
i
(t)
​
 )) and 
μ
i
(
t
)
=
σ
(
w
(
t
)
T
v
i
)
μ 
i
(t)
​
 =σ(w 
(t)T
 v 
i
​
 ).

10.3 Regret Pattern Detection
A regret is identified when a user references a past decision negatively. The system tracks:

RegretScore
(
d
)
=
negative_sentiment
(
references_to
(
d
)
)
⋅
frequency
(
references_to
(
d
)
)
RegretScore(d)=negative_sentiment(references_to(d))⋅frequency(references_to(d))

Pattern extraction:

text

ALGORITHM DetectRegretPatterns(decision_log)
─────────────────────────────────────────────
Input:  decision_log — list of (decision, context, outcome, reflections)
Output: regret patterns

1.  regretted ← {d ∈ decision_log : RegretScore(d) > θ_regret}

2.  // Extract common features of regretted decisions
    regret_features ← ∅
    FOR each d ∈ regretted:
        regret_features ← regret_features ∪ Features(d.context)

3.  // Find features over-represented in regretted vs. non-regretted
    non_regretted_features ← Features(decision_log \ regretted)
    
    FOR each feature f:
        freq_regret ← frequency(f, regret_features)
        freq_normal ← frequency(f, non_regretted_features)
        odds_ratio ← (freq_regret / (1 - freq_regret)) / (freq_normal / (1 - freq_normal))
        
        IF odds_ratio > 2.0 AND freq_regret > 0.3:
            patterns ← patterns ∪ {(f, odds_ratio, examples = regretted ∩ has_feature(f))}

4.  RETURN patterns sorted by odds_ratio DESC
Output example: "Decisions made under time pressure with high novelty are 3.2× more likely to be regretted. Examples: [memory1, memory2, memory3]."

11. Temporal Commitments & Zero-Knowledge Proofs
11.1 Pedersen Commitment Scheme
Let 
G
G be a group of prime order 
q
q with generators 
g
g and 
h
h (where 
log
⁡
g
h
log 
g
​
 h is unknown).

Commit:

C
=
g
m
⋅
h
r
m
o
d
 
 
p
C=g 
m
 ⋅h 
r
 modp

where 
m
m is the message (hash of memory content) mapped to 
Z
q
Z 
q
​
  and 
r
←
$
Z
q
r 
$
​
 Z 
q
​
  is the random blinding factor.

Properties:

Hiding: Given 
C
C, no information about 
m
m is revealed (information-theoretically hiding)
Binding: Cannot find 
m
′
≠
m
m 
′
 

=m and 
r
′
r 
′
  such that 
g
m
′
h
r
′
=
C
g 
m 
′
 
 h 
r 
′
 
 =C (computationally binding under DLP)
11.2 Zero-Knowledge Proof of Knowledge
Prove: "I know 
m
m and 
r
r such that 
C
=
g
m
h
r
C=g 
m
 h 
r
 " without revealing 
m
m or 
r
r.

Schnorr-like Sigma protocol:

text

PROTOCOL ZK_ProofOfKnowledge(C, m, r, g, h)
─────────────────────────────────────────────
Prover knows: m, r such that C = g^m · h^r

1.  Prover:
    a.  Choose random k_m, k_r ∈ℤ_q
    b.  Compute A = g^{k_m} · h^{k_r}
    c.  Send A to Verifier

2.  Verifier:
    a.  Choose random challenge e ∈ℤ_q
    b.  Send e to Prover

3.  Prover:
    a.  Compute z_m = k_m + e · m  (mod q)
    b.  Compute z_r = k_r + e · r  (mod q)
    c.  Send (z_m, z_r) to Verifier

4.  Verifier:
    a.  Check: g^{z_m} · h^{z_r} = A · C^e
    b.  Accept if equal, reject otherwise

Correctness: g^{z_m} · h^{z_r} = g^{k_m + em} · h^{k_r + er}
           = g^{k_m} h^{k_r} · (g^m h^r)^e = A · C^e  ✓
Non-interactive (Fiat-Shamir):

e
=
H
(
C
∥
A
∥
context
)
e=H(C∥A∥context)

where 
H
H is a cryptographic hash. The proof is 
π
=
(
A
,
z
m
,
z
r
)
π=(A,z 
m
​
 ,z 
r
​
 ).

11.3 Selective Disclosure: Proving Properties
Prove that committed content satisfies a predicate without revealing content.

For simple predicates (e.g., "memory contains keyword 
k
k"):

Use a Merkle tree commitment over the memory's token set:

Build a Merkle tree over tokenized content
Commitment is the Merkle root 
R
R
To prove presence of token 
k
k: reveal the Merkle path for 
k
k's leaf
Verifier checks path against 
R
R
For complex predicates (e.g., "memory was created before date 
D
D"):

Encode the predicate as an arithmetic circuit and use a zk-SNARK (Groth16 or Plonk):

Circuit
(
m
,
r
,
C
,
D
)
:
C
=
Commit
(
m
,
r
)
∧
m
.
timestamp
<
D
Circuit(m,r,C,D):C=Commit(m,r)∧m.timestamp<D

Practical consideration: For the Sovereign Memory use case, we use Bulletproofs for range proofs (timestamp in range) and Merkle proofs for content properties. Full zk-SNARKs reserved for complex predicates due to proof generation cost.

11.4 Anchoring to Public Time
Rust

// Anchoring options with security/speed tradeoffs

pub enum AnchorStrategy {
    // Batch anchor: collect commitments over a period, 
    // build Merkle tree, anchor root
    BatchMerkle {
        batch_interval: Duration,  // e.g., 1 hour
        anchor: AnchorBackend,
    },
    
    // Individual anchor (expensive but immediate)
    Individual {
        anchor: AnchorBackend,
    },
}

pub enum AnchorBackend {
    // Bitcoin OP_RETURN (highest security, ~$0.10/anchor, ~10min confirmation)
    Bitcoin,
    // Ethereum log event (~$0.50/anchor, ~15sec confirmation)  
    Ethereum,
    // RFC 3161 TSA (free-$0.01, instant, requires trust in TSA)
    TimestampAuthority { url: String },
    // Distributed transparency log (free, seconds, requires log availability)
    TransparencyLog { servers: Vec<String> },
}
Batch Merkle construction:

text

ALGORITHM BatchAnchor(commitments C, interval)
────────────────────────────────────────────────
1.  // Collect commitments over interval
    batch ← CollectCommitments(interval)

2.  // Build Merkle tree
    leaves ← [Hash(c) for c in batch]
    tree ← BuildMerkleTree(leaves)
    root ← tree.root

3.  // Anchor root to public log
    proof ← Anchor(root, backend)

4.  // Store inclusion proofs for each commitment
    FOR each c in batch:
        path ← tree.proof(c)
        StoreInclusionProof(c, path, root, proof)

5.  RETURN proof
Each commitment can later prove its existence at anchor time by showing: commitment → Merkle path → root → anchor proof.

12. Ontological Lensing
12.1 Formal Definition
A lens is a tuple 
L
=
(
σ
,
π
,
ω
,
ρ
)
L=(σ,π,ω,ρ):

σ
:
V
→
{
0
,
1
}
σ:V→{0,1} — selector (which memories to include)
π
:
2
V
→
P
π:2 
V
 →P — projection (how to organize selected memories into structure 
P
P)
ω
:
E
→
R
+
ω:E→R 
+
  — edge weighting (which connections to emphasize)
ρ
:
P
→
R
ρ:P→R — renderer (how to present the structure)
12.2 Causal Lens
The causal lens emphasizes cause-effect chains:

Selector:

σ
causal
(
m
)
=
1
 ⁣
[
∃
e
∈
E
:
e
.
type
=
causal
∧
(
e
.
source
=
m
∨
e
.
target
=
m
)
]
σ 
causal
​
 (m)=1[∃e∈E:e.type=causal∧(e.source=m∨e.target=m)]

Edge weighting:

w(e, t) \cdot 2.0 & \text{if } e.\text{type} = \text{causal} \\ w(e, t) \cdot 0.5 & \text{if } e.\text{type} = \text{temporal} \\ 0 & \text{otherwise} \end{cases}$$
Projection — causal DAG extraction:

text

ALGORITHM CausalProjection(G, σ, ω)
─────────────────────────────────────
Input:  G — cognitive graph, σ — selector, ω — edge weights
Output: P — causal DAG

1.  V' ← {m ∈ V : σ(m) = 1}
2.  E' ← {e ∈ E : e.type = causal AND e.source ∈ V' AND e.target ∈ V'}
3.  
4.  // Ensure DAG property (remove cycles via temporal ordering)
5.  FOR each cycle detected in (V', E'):
6.      Remove the edge with the lowest ω(e) in the cycle
7.  
8.  // Topological sort for rendering
9.  layers ← TopologicalSort(V', E')
10. 
11. // Identify root causes (no incoming causal edges)
12. roots ← {m ∈ V' : in_degree(m, E') = 0}
13. 
14. // Identify terminal effects (no outgoing causal edges)
15. terminals ← {m ∈ V' : out_degree(m, E') = 0}
16. 
17. RETURN CausalDAG(layers, roots, terminals, E')
12.3 Emotional Lens
Memories projected onto a valence-arousal plane:

Emotional coordinates:

(
valence
(
m
)
,
arousal
(
m
)
)
∈
[
−
1
,
1
]
2
(valence(m),arousal(m))∈[−1,1] 
2
 

Estimated from memory content using sentiment analysis + emotional keyword detection.

Projection — emotional landscape:

text

ALGORITHM EmotionalProjection(memories M)
──────────────────────────────────────────
Input:  M — selected memories with emotional annotations
Output: 2D emotional landscape

1.  // Place each memory on the valence-arousal plane
    points ← [(valence(m), arousal(m), m) for m in M]

2.  // Kernel density estimation for the emotional landscape
    grid ← 100 × 100 grid over [-1,1]²
    FOR each grid point (x, y):
        density(x, y) ← Σ_m K_h((x,y) - (valence(m), arousal(m)))
    
    where K_h is a Gaussian kernel with bandwidth h

3.  // Identify emotional clusters
    clusters ← MeanShift(points, bandwidth = 0.3)

4.  // Label clusters
    FOR each cluster c:
        label(c) ← EmotionLabel(centroid(c))
        // e.g., high valence + high arousal = "excitement"
        //        low valence + high arousal = "anxiety"

5.  RETURN EmotionalLandscape(points, density, clusters)
12.4 Lens C
