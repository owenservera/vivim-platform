# Note 27-02-2026 11:26 PM





\# UnChain Data Sharing: Tokenization & Distribution System Design



\## Full Technical Specification



\---



\## 1. System Architecture Overview



\`\`\`

┌─────────────────────────────────────────────────────────────────┐

│ DATA CONSUMERS (AI TRAINERS) │

│ Buy data access by spending/burning $UDC │

└──────────────────────────────┬──────────────────────────────────┘

│ Payment Flow ($UDC)

▼

┌─────────────────────────────────────────────────────────────────┐

│ PROTOCOL SMART CONTRACT │

│ Epoch Emissions + Marketplace Revenue Pool │

│ │

│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │

│ │ Data Share │ │ Storage │ │ Network/Routing │ │

│ │ Pool (50%) │ │ Pool (30%) │ │ Pool (20%) │ │

│ └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘ │

└──────────┼─────────────────┼───────────────────┼────────────────┘

│ │ │

▼ ▼ ▼

┌──────────────┐ ┌──────────────┐ ┌──────────────────┐

│ INDIVIDUAL │ │ STORAGE │ │ NETWORK │

│ SHARING │ │ NODES │ │ ROUTING │

│ NODES │ │ │ │ NODES │

│ │ │ Store & │ │ │

│ Users who │ │ serve │ │ Discovery, │

│ share AI │ │ encrypted │ │ matchmaking, │

│ chat data │ │ data shards │ │ data delivery │

└──────────────┘ └──────────────┘ └──────────────────┘

\`\`\`



\---



\## 2. Token: $UDC (UnChain Data Credit)



\| Parameter \| Value \|

\|------------------------\|------------------------------\|

\| Max Supply \| 2,100,000,000 $UDC \|

\| Initial Epoch Emission \| 1,000,000 $UDC/day \|

\| Halving Period \| 730 epochs (≈2 years) \|

\| Epoch Duration \| 24 hours \|

\| Burn Mechanism \| 15% of all data purchases \|

\| Staking Lock Periods \| 30 / 90 / 180 / 365 days \|



\---



\## 3. Data Valuation Mathematics



This is the core engine — every shared conversation must be scored to determine fair compensation.



\### 3.1 Data Value Score (DVS)



For each shared conversation \*\*c\*\* by user \*\*u\*\*:



\`\`\`

DVS(c) = [ α·Q(c) + β·U(c) + γ·L(c) + δ·F(c) ] × D(c) × SG(c)

\`\`\`



\| Symbol \| Component \| Weight \| Range \|

\|--------\|---------------------\|--------\|-------------\|

\| Q(c) \| Quality Score \| α=0.30 \| [0, 1] \|

\| U(c) \| Uniqueness Score \| β=0.30 \| [0, 1] \|

\| L(c) \| Length/Depth Score \| γ=0.15 \| [0, 1] \|

\| F(c) \| Freshness Score \| δ=0.25 \| [0, 1] \|

\| D(c) \| Demand Multiplier \| — \| [0.5, 5.0] \|

\| SG(c) \| Sharing Granularity \| — \| [0.1, 1.0] \|



\---



\### 3.2 Quality Score — Q(c)



Measures how useful the conversation is for AI training:



\`\`\`

Q(c) = w₁·Coherence(c) + w₂·InfoDensity(c) + w₃·Complexity(c) + w₄·Correctness(c)

\`\`\`



\| Sub-metric \| Weight \| Measurement Method \|

\|---------------------\|--------\|---------------------------------------------\|

\| Coherence \| 0.25 \| LLM-based coherence classifier \|

\| Information Density \| 0.30 \| Unique n-gram ratio, entity density \|

\| Complexity \| 0.25 \| Vocabulary diversity + reasoning depth \|

\| Correctness \| 0.20 \| Factual accuracy sampling (automated + spot) \|



\*\*Automated Quality Pipeline:\*\*

\`\`\`

Raw Chat → Anonymization → Quality Classifier Model → Q(c) ∈ [0,1]

\`\`\`



The quality classifier is itself trained on human-labeled samples and updated quarterly. A random 2% of submissions are human-reviewed for calibration.



\---



\### 3.3 Uniqueness Score — U(c)



Prevents reward for duplicate/redundant data:



\`\`\`

U(c) = 1 − max( sim(emb(c), emb(c\_j)) | c\_j ∈ Corpus )

\`\`\`



Where:

\- \`emb(c)\` = embedding vector of conversation c (using sentence-transformer)

\- \`sim\` = cosine similarity

\- \`Corpus\` = all previously ingested conversations



\*\*Efficient Approximation (for scale):\*\*

Using Locality-Sensitive Hashing (LSH) or FAISS approximate nearest neighbor:



\`\`\`

U(c) = 1 − ANN\_max\_similarity(c, Corpus, k=50)

\`\`\`



Only compare against top-k nearest neighbors. If max similarity \> 0\.95, flag as near-duplicate and set U(c) = 0.



\*\*Topic-Level Saturation Adjustment:\*\*



\`\`\`

U\_adjusted(c) = U(c) × TopicScarcity(topic(c))



TopicScarcity(t) = 1 − [ count(t) / (count(t) + κ) ]

\`\`\`



Where κ is a half-saturation constant (e.g., κ = 10,000 conversations). Topics with fewer samples get higher scarcity multipliers.



\---



\### 3.4 Length/Depth Score — L(c)



Logarithmic scaling prevents gaming by padding:



\`\`\`

L(c) = min(1, ln(1 + WordCount(c)) / ln(1 + W\_max))

\`\`\`



Where W\_max = 10,000 (reference max useful length).



\*\*Turn Depth Bonus:\*\*

\`\`\`

L(c) = 0.7 × TextLength + 0.3 × min(1, Turns(c) / T\_max)

\`\`\`



Where T\_max = 50 turns. Multi-turn deep conversations are more valuable than single exchanges.



\---



\### 3.5 Freshness Score — F(c)



Exponential time decay:



\`\`\`

F(c) = exp(−λ · age\_days(c))

\`\`\`



Where λ = 0.01 (half-life ≈ 69 days). Recent data is more valuable because:

\- It reflects current language patterns

\- It covers recent events/knowledge

\- It hasn't been absorbed into existing models



\---



\### 3.6 Demand Multiplier — D(c)



Driven by the data marketplace (AI companies posting bounties):



\`\`\`

D(c) = D\_base + Σ\_(b ∈ ActiveBounties) [ relevance(c, b) × budget\_remaining(b) / supply\_matching(b) ]

\`\`\`



Where:

\- D\_base = 1.0 (baseline)

\- \`relevance(c, b)\` = cosine similarity between conversation topic embedding and bounty description embedding

\- \`budget\_remaining(b)\` = unfilled budget of bounty b

\- \`supply\_matching(b)\` = total existing supply matching bounty b



\*\*Clamped to [0.5, 5.0]\*\* to prevent extreme swings.



\*\*Example Demand Signals:\*\*

\| Topic \| Current Supply \| Demand \| D multiplier \|

\|---------------------------\|---------------\|--------\|--------------\|

\| Medical Q&A \| Low \| High \| 3.8 \|

\| General chitchat \| High \| Low \| 0.6 \|

\| Code debugging \| Medium \| High \| 2.5 \|

\| Legal reasoning \| Low \| Medium \| 2.1 \|

\| Multi-lingual (rare lang) \| Very Low \| Medium \| 4.2 \|



\---



\### 3.7 Sharing Granularity Multiplier — SG(c)



Users choose their sharing depth per conversation:



\`\`\`

┌────────────────────────────────────────────────────────────┐

│ SHARING LEVELS │

│ │

│ Level 1: Metadata Only SG = 0.10 │

│ (topic, length, timestamp, language) │

│ │

│ Level 2: Statistical Abstractions SG = 0.25 │

│ (topic distribution, vocabulary stats, │

│ anonymized structural patterns) │

│ │

│ Level 3: Anonymized Summaries SG = 0.40 │

│ (AI-generated summary, entities removed) │

│ │

│ Level 4: Anonymized Full Text SG = 0.65 │

│ (PII stripped, entities generalized) │

│ │

│ Level 5: Full Text + Context SG = 0.85 │

│ (complete conversation, system prompts, │

│ model used, settings) │

│ │

│ Level 6: Full Text + Profile Metadata SG = 1.00 │

│ (everything + user expertise domain, │

│ interaction patterns, quality labels) │

└────────────────────────────────────────────────────────────┘

\`\`\`



Users can set a \*\*default level\*\* and override per-conversation.



\---



\## 4. Token Generation Model 1: Individual Sharing Nodes (Data Providers)



\### 4.1 Per-User Value Contribution



In epoch \*\*t\*\*, user \*\*u\*\* contributes:



\`\`\`

V\_u(t) = RP(u,t) × DR(u,t) × Σ\_{c ∈ C\_u(t)} DVS(c)

\`\`\`



Where:

\- \`C\_u(t)\` = set of conversations shared by user u in epoch t

\- \`RP(u,t)\` = reputation multiplier

\- \`DR(u,t)\` = diminishing returns factor



\### 4.2 Reputation Multiplier — RP(u,t)



\`\`\`

RP(u,t) = 0.5 + 1.5 × sigmoid(k · ReputationScore(u,t))

\`\`\`



Bounded in \*\*[0.5, 2.0]\*\*. Reputation score accumulates:



\`\`\`

ReputationScore(u,t) = Σ over history {

\+ consistency\_bonus(u) // regular sharing patterns

\+ quality\_history(u) // avg quality of past contributions

\+ longevity\_bonus(u) // time in network

\+ verification\_bonus(u) // KYC tier

− fraud\_penalties(u) // detected gaming attempts

− dispute\_penalties(u) // data quality disputes lost

}

\`\`\`



\*\*Consistency Bonus:\*\*

\`\`\`

consistency\_bonus(u) = min(1.0, active\_epochs(u, last\_90\_days) / 90)

\`\`\`



\*\*Quality History:\*\*

\`\`\`

quality\_history(u) = EMA(Q(c\_1), Q(c\_2), ..., Q(c\_n)) [exponential moving avg]

\`\`\`



\### 4.3 Diminishing Returns Factor — DR(u,t)



Prevents single-user dominance:



\`\`\`

DR(u,t) = (N\_cap / (N\_cap + n\_u(t) − 1))^ψ

\`\`\`



Where:

\- \`n\_u(t)\` = number of conversations shared by u in epoch t

\- \`N\_cap\` = soft cap (e.g., 50 conversations/epoch)

\- \`ψ\` = 0.3 (diminishing exponent)



\`\`\`

Conversations: 1 10 50 100 500 1000

DR value: 1.0 0.92 0.76 0.64 0.42 0.33

\`\`\`



\### 4.4 Epoch Reward Distribution



\`\`\`

R\_u(t) = [ V\_u(t) / Σ\_i V\_i(t) ] × E\_data(t) + DirectPayment\_u(t)

\`\`\`



Where:

\- \*\*E\_data(t)\*\* = emission-based pool for data providers

\- \*\*DirectPayment\_u(t)\*\* = revenue from AI companies purchasing user u's specific data



\*\*Emission Pool:\*\*

\`\`\`

E\_data(t) = ω\_d(t) × E(t)

\`\`\`



\*\*Direct Payment (marketplace revenue):\*\*

\`\`\`

DirectPayment\_u(t) = Σ\_{purchase p using data from u} {

price(p) × (DVS(c\_u) / Σ DVS(c\_all\_in\_p)) × (1 − protocol\_fee)

}

\`\`\`



Protocol fee = 10%, of which 5% goes to treasury, 5% is burned.



\---



\## 5. Token Generation Model 2: Storage Nodes



\### 5.1 Storage Contribution Score



For storage node \*\*s\*\* in epoch \*\*t\*\*:



\`\`\`

C\_s(t) = Σ\_{d ∈ DataShards(s)} [ Size(d) × ValueWeight(d) × Rarity(d,s) ]

× Availability(s,t) × Performance(s,t) × ProofScore(s,t)

\`\`\`



\### 5.2 Component Definitions



\*\*Size(d):\*\* normalized data shard size in GB

\`\`\`

Size(d) = raw\_size\_GB(d) / reference\_unit (reference\_unit = 1 GB)

\`\`\`



\*\*ValueWeight(d):\*\* average DVS of conversations in shard d

\`\`\`

ValueWeight(d) = avg{ DVS(c) \| c ∈ shard d }

\`\`\`



This means storing high-value data earns more than storing low-value data.



\*\*Rarity(d,s):\*\* inverse of replication factor — rewards storing under-replicated data

\`\`\`

Rarity(d,s) = (R\_target / R\_actual(d))^0.5

\`\`\`



Where:

\- R\_target = target replication factor (e.g., 5)

\- R\_actual(d) = current number of nodes storing shard d

\- Clamped to [0.2, 3.0]



If a shard is under-replicated (R\_actual < R\_target), Rarity \> 1 → bonus.

If over-replicated, Rarity < 1 → penalty.



\*\*Availability(s,t):\*\*

\`\`\`

Availability(s,t) = successful\_challenge\_responses(s,t) / total\_challenges(s,t)

\`\`\`



Nodes are randomly challenged \~48 times per epoch (every 30 minutes) to prove data availability via Proof of Retrievability (PoR).



\*\*Performance(s,t):\*\*

\`\`\`

Performance(s,t) = min(1.0, target\_latency / avg\_retrieval\_latency(s,t))

× min(1.0, actual\_bandwidth(s,t) / committed\_bandwidth(s))

\`\`\`



\*\*ProofScore(s,t):\*\*

\`\`\`

ProofScore(s,t) = PoR\_pass\_rate(s,t) × PoS\_integrity\_rate(s,t)

\`\`\`



Where:

\- PoR = Proof of Retrievability (can you serve the data?)

\- PoS = Proof of Storage (do you actually store it, not just cache?)



\### 5.3 Proof of Storage Mechanism



\`\`\`

┌─────────────────────────────────────────────┐

│ PROOF OF STORAGE PROTOCOL │

│ │

│ 1\. Protocol selects random shard d │

│ 2\. Generates random challenge vector v │

│ 3\. Node must compute: │

│ response = H(d[v[0]] \|\| d[v[1]] \|\| ... │

│ \|\| d[v[k]] \|\| nonce) │

│ 4\. Protocol verifies against known hash │

│ 5\. Must respond within τ = 5 seconds │

│ │

│ Failure Penalties: │

│ \- 1st failure: warning │

│ \- 2nd failure: 10% reward reduction │

│ \- 3rd failure: 50% reward reduction │

│ \- 4+ failures: eviction + stake slash (5%) │

└─────────────────────────────────────────────┘

\`\`\`



\### 5.4 Storage Node Staking



\`\`\`

MinStake(s) = BaseStake + MarginalRate × CommittedStorage\_TB(s)

\`\`\`



\| Parameter \| Value \|

\|------------------\|----------------\|

\| BaseStake \| 10,000 $UDC \|

\| MarginalRate \| 2,000 $UDC/TB \|

\| Slash: minor \| 1% of stake \|

\| Slash: data loss \| 10% of stake \|

\| Slash: fraud \| 100% of stake \|



\### 5.5 Storage Node Reward



\`\`\`

R\_s(t) = [ C\_s(t) / Σ\_j C\_j(t) ] × E\_storage(t) + ServiceFees\_s(t)

\`\`\`



Where ServiceFees come from direct data retrieval charges paid by consumers.



\---



\## 6. Token Generation Model 3: Network/Routing Nodes



\### 6.1 Routing Contribution Score



For routing node \*\*r\*\* in epoch \*\*t\*\*:



\`\`\`

N\_r(t) = Routes(r,t) × BW(r,t) × Latency(r,t) × Uptime(r,t) × Coverage(r)

\`\`\`



\### 6.2 Component Definitions



\*\*Routes(r,t):\*\* successful data transfers facilitated

\`\`\`

Routes(r,t) = Σ\_{transfer τ via r} DataVolume(τ) × VerificationSuccess(τ)

\`\`\`



Each completed transfer is verified by both sender and receiver signing a receipt.



\*\*Bandwidth Factor BW(r,t):\*\*

\`\`\`

BW(r,t) = min(1.0, measured\_bandwidth(r,t) / committed\_bandwidth(r))

\`\`\`



Measured via periodic speed tests and actual transfer throughput.



\*\*Latency Score:\*\*

\`\`\`

Latency(r,t) = exp(−μ × (avg\_latency\_ms(r,t) − baseline\_ms))

\`\`\`



Where μ = 0.005, baseline\_ms = 50ms. Low-latency nodes are rewarded more.



\`\`\`

Avg Latency: 50ms 100ms 200ms 500ms 1000ms

Score: 1.00 0.78 0.47 0.11 0.01

\`\`\`



\*\*Uptime(r,t):\*\*

\`\`\`

Uptime(r,t) = minutes\_online(r,t) / total\_minutes\_in\_epoch

\`\`\`



Measured via heartbeat pings every 60 seconds.



\*\*Geographic Coverage Bonus:\*\*

\`\`\`

Coverage(r) = 1 + η × (1 / NodeDensity(region(r)))

\`\`\`



Where η = 0.5 and NodeDensity is normalized. Nodes in underserved regions earn up to 1.5× bonus.



\### 6.3 Routing Services Provided



\`\`\`

┌─────────────────────────────────────────────────┐

│ NETWORK LAYER SERVICES │

│ │

│ 1\. DATA DISCOVERY │

│ \- Index propagation │

│ \- Search query routing │

│ \- Metadata aggregation │

│ │

│ 2\. DATA DELIVERY │

│ \- Shard retrieval orchestration │

│ \- Multi-source parallel download │

│ \- Erasure code reconstruction │

│ │

│ 3\. PRIVACY LAYER │

│ \- Onion routing for anonymous queries │

│ \- Mix networks for metadata privacy │

│ \- Zero-knowledge proof relay │

│ │

│ 4\. MATCHMAKING │

│ \- Connect data bounties to providers │

│ \- Quality-filtered search │

│ \- Price negotiation facilitation │

└─────────────────────────────────────────────────┘

\`\`\`



\### 6.4 Routing Node Staking



\`\`\`

MinStake(r) = BaseStake + BandwidthRate × CommittedBandwidth\_Gbps(r)

\`\`\`



\| Parameter \| Value \|

\|-------------------\|--------------------\|

\| BaseStake \| 5,000 $UDC \|

\| BandwidthRate \| 3,000 $UDC/Gbps \|

\| Slash: downtime \| 0.5% of stake/day \|

\| Slash: censorship \| 20% of stake \|

\| Slash: data leak \| 50% of stake \|



\### 6.5 Routing Node Reward



\`\`\`

R\_r(t) = [ N\_r(t) / Σ\_k N\_k(t) ] × E\_network(t) + RoutingFees\_r(t)

\`\`\`



RoutingFees = micro-payments per data transfer, paid by the data consumer:

\`\`\`

RoutingFee(τ) = BaseFee + PerGB\_Rate × DataVolume(τ)

\`\`\`



\---



\## 7. Dynamic Pool Weight Adjustment



The base split (50/30/20) adjusts dynamically based on network needs:



\`\`\`

ω\_d(t) = ω\_d\_base × (Demand\_data / Supply\_data)^(1/3) / Z(t)

ω\_s(t) = ω\_s\_base × (Demand\_storage / Supply\_storage)^(1/3) / Z(t)

ω\_n(t) = ω\_n\_base × (Demand\_routing / Supply\_routing)^(1/3) / Z(t)

\`\`\`



Where Z(t) normalizes so ω\_d + ω\_s + ω\_n = 1.



\*\*Guard Rails:\*\*

\`\`\`

ω\_d(t) ∈ [0.30, 0.65]

ω\_s(t) ∈ [0.15, 0.45]

ω\_n(t) ∈ [0.10, 0.30]

\`\`\`



\*\*Measurement:\*\*

\`\`\`

Demand\_data = active bounty budget ($UDC committed by AI companies)

Supply\_data = total DVS of available data in the epoch



Demand\_storage = total data size needing storage + replication gap

Supply\_storage = total committed storage capacity



Demand\_routing = total data transfer requests queued

Supply\_routing = total available routing bandwidth

\`\`\`



\---



\## 8. Emission Schedule



\### 8.1 Halving Model



\`\`\`

E(t) = E\_0 × 2^(−⌊t / H⌋)

\`\`\`



\| Epoch Range \| Daily Emission \| Annual Emission \| Cumulative % \|

\|--------------------\|----------------\|------------------\|----------------\|

\| 0–729 (Yr 1–2) \| 1,000,000 \| 365,000,000 \| 34.8% \|

\| 730–1459 (Yr 3–4) \| 500,000 \| 182,500,000 \| 52.1% \|

\| 1460–2189 (Yr 5–6)\| 250,000 \| 91,250,000 \| 60.8% \|

\| 2190–2919 (Yr 7–8)\| 125,000 \| 45,625,000 \| 65.1% \|

\| ... \| ... \| ... \| → 100% \|



\### 8.2 Transition to Fee-Driven Economy



As emission decreases, the system transitions to revenue-driven rewards:



\`\`\`

TotalReward\_pool(t) = E(t) + MarketplaceRevenue(t) × (1 − burn\_rate − treasury\_rate)

\`\`\`



\`\`\`

Revenue Mix Over Time

Reward │

Source │ ████████ Emission

│ ████████████

│ ████████████████

│ ███████████████████████ ░░░░░ Marketplace Revenue

│ █████████████████████░░░░░░░░░░░░░

│ ███████████████████░░░░░░░░░░░░░░░░░░░

│ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░

└──────────────────────────────────────────────→ Time

Year 1 Year 3 Year 5 Year 8+

\`\`\`



\---



\## 9. Data Consumer (AI Company) Payment Model



\### 9.1 Data Access Pricing



\`\`\`

Price(dataset) = Σ\_{c ∈ dataset} BasePricePerUnit × DVS(c) × AccessTier(tier)

\`\`\`



\| Access Tier \| Multiplier \| Description \|

\|-------------------\|-----------\|---------------------------------------\|

\| Preview \| 0.1× \| Statistical summary only \|

\| Standard \| 1.0× \| Anonymized text, single-use license \|

\| Premium \| 2.5× \| Full context, multi-use license \|

\| Exclusive \| 10.0× \| Time-limited exclusivity window \|



\### 9.2 Payment Distribution Flow



\`\`\`

AI Company pays 1000 $UDC for a dataset

│

├── 150 $UDC → BURNED (15%) ─── deflationary pressure

├── 50 $UDC → TREASURY (5%) ── protocol development

│

└── 800 $UDC → DISTRIBUTED:

├── 560 $UDC (70%) → Data Providers

│ └── Split proportional to DVS of each user's data in the set

├── 160 $UDC (20%) → Storage Nodes

│ └── Split proportional to C\_s for nodes serving this data

└── 80 $UDC (10%) → Routing Nodes

└── Split proportional to N\_r for nodes that facilitated transfer

\`\`\`



\---



\## 10. Anti-Gaming & Quality Assurance



\### 10.1 Attack

