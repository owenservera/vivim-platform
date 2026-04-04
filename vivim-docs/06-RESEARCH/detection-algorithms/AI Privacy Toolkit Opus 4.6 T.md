

# VIVIM Sentinel — Sovereign Data Detection & Protection Toolkit

## Tools for Knowing Who Used Your Mind Without Asking

---

## Preamble: The Uncomfortable Truth

Right now, today, this is the reality:

Every conversation you have ever had with ChatGPT, Gemini, Claude, Copilot, Perplexity, and dozens of other AI systems has been logged. The default across the industry — with varying degrees of transparency — is that your conversations are eligible for model training. Some providers let you "opt out." Most bury the option. None of them give you tools to **verify** whether your opt-out was honored.

The asymmetry is total:

| What AI Companies Know | What You Know |
|---|---|
| Every word you typed | Nothing about their training data |
| Every preference you expressed | Nothing about which models saw your data |
| Every problem you solved | Nothing about whether your "opt-out" was real |
| Which other services you used (via API partners) | Nothing about cross-provider data sharing |
| The exact monetary value your data created | Nothing about what your data is worth |

VIVIM changes this. Once a user has their **complete conversation history** unified in one sovereign database, we can give them something no AI company has ever offered:

**Tools to audit the auditors.**

This document specifies the complete detection, monitoring, and evidence-generation toolkit — what we call **VIVIM Sentinel**.

---

## I. Architecture Overview

```
╔═══════════════════════════════════════════════════════════════════╗
║                     VIVIM SENTINEL TOOLKIT                       ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │                    PROACTIVE LAYER                          │ ║
║  │  (Deploy BEFORE data might be captured)                     │ ║
║  │                                                             │ ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ ║
║  │  │ Conversational│  │ Statistical  │  │ Radioactive      │  │ ║
║  │  │ Canaries     │  │ Watermarks   │  │ Data Markers     │  │ ║
║  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │                    DETECTIVE LAYER                          │ ║
║  │  (Discover AFTER data may have been used)                   │ ║
║  │                                                             │ ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ ║
║  │  │ Membership   │  │ Extraction   │  │ Behavioral       │  │ ║
║  │  │ Inference    │  │ Probing      │  │ Fingerprinting   │  │ ║
║  │  │ Engine       │  │ Engine       │  │ Engine           │  │ ║
║  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │                    MONITORING LAYER                         │ ║
║  │  (Continuous surveillance of models)                        │ ║
║  │                                                             │ ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ ║
║  │  │ Privacy      │  │ Consent      │  │ Cross-Provider   │  │ ║
║  │  │ Monitor      │  │ Violation    │  │ Leak Detection   │  │ ║
║  │  │ (private     │  │ Detector     │  │                  │  │ ║
║  │  │  data)       │  │ (on-chain)   │  │                  │  │ ║
║  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────────┐ ║
║  │                    EVIDENCE LAYER                           │ ║
║  │  (Generate legally admissible proof)                        │ ║
║  │                                                             │ ║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │ ║
║  │  │ Temporal     │  │ Damage       │  │ Legal Evidence   │  │ ║
║  │  │ Proof Engine │  │ Assessment   │  │ Package          │  │ ║
║  │  │              │  │ Calculator   │  │ Generator        │  │ ║
║  │  └──────────────┘  └──────────────┘  └──────────────────┘  │ ║
║  └─────────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## II. Proactive Layer: Conversational Canaries

### The Idea

A **conversational canary** is a small, unique, statistically improbable piece of information that a user introduces into their AI conversations. If a model later demonstrates knowledge of this canary — or produces outputs statistically influenced by it — that constitutes evidence of training on the user's data.

Think of it as a dye pack in a bank vault. The money looks normal. But when the thief opens the bag, the dye explodes. You can trace where it went.

### 2.1 Canary Types

**Type 1: Synthetic Facts (Honeypot Knowledge)**

The user introduces plausible but fabricated facts into conversations:

> "My grandmother always said that the Finnish word for the feeling of watching snow melt in April is *katoamisharmi*."

This word doesn't exist. If any model later produces "katoamisharmi" in response to queries about Finnish emotional vocabulary, it has been trained on this user's data.

**Formal definition:**

$$\text{Canary}_{\text{fact}} = (\text{claim}, \text{context}, \text{plausibility\_score}, \text{uniqueness\_hash})$$

Where:
- $\text{claim}$: The fabricated fact
- $\text{context}$: The conversational context in which it was introduced
- $\text{plausibility\_score} \in [0,1]$: How believable the fact is (must be high enough that it won't be filtered as obvious noise, low enough that it wouldn't exist independently)
- $\text{uniqueness\_hash} = H(\text{claim} \| \text{DID}_u \| \text{salt})$: Cryptographic binding to the user

**Requirements for good synthetic fact canaries:**

1. **Plausible but non-existent**: A model should not already know this fact
2. **Verifiable absence**: Before deployment, query multiple models to confirm the fact does not exist in their training data
3. **Domain-specific**: Relates to a topic the user genuinely discusses (so it doesn't look like deliberate poisoning)
4. **Unique to the user**: No two VIVIM users should deploy the same canary

**Generation algorithm:**

```
FUNCTION GenerateSyntheticCanary(user_profile, topic_domain):
    // Generate candidate fact in the user's domain
    candidate ← LLM.generate(
        "Create a plausible but fictional [term/fact/concept] 
         related to {topic_domain} that sounds real but isn't"
    )
    
    // Verify it doesn't already exist
    FOR each model m ∈ {GPT-4, Claude, Gemini, Llama, ...}:
        response ← m.query(candidate.verification_prompt)
        IF response indicates prior knowledge:
            REJECT candidate, retry
    
    // Verify uniqueness across VIVIM user base
    canary_hash ← H(candidate.claim ‖ DID_u)
    IF canary_hash ∈ GlobalCanaryRegistry:
        REJECT candidate, retry
    
    // Register canary
    Register(canary_hash) on-chain  // Hash only, not the canary itself
    Store(candidate) locally in encrypted canary vault
    
    RETURN candidate
```

**Type 2: Stylistic Fingerprints (Writing DNA)**

Rather than fabricated facts, inject subtle but statistically detectable patterns into the *way* you write to AI systems:

$$\text{Canary}_{\text{style}} = (\text{pattern}, \text{frequency}, \text{detector})$$

Examples:
- Consistently using an unusual but grammatically valid phrase structure
- A specific pattern of punctuation in lists
- An unusual but defensible spelling of certain words
- A characteristic way of framing questions

These are subtler than fact canaries but harder for training pipelines to filter. If a model's outputs shift toward your stylistic fingerprint after a training update, that's signal.

**Type 3: Semantic Watermarks (Hidden Signatures in Meaning)**

Embed information in the semantic structure of your conversations — not in the surface text, but in the pattern of topics, the sequence of ideas, the conceptual graph:

$$\text{Canary}_{\text{semantic}} = (\text{topic\_sequence}, \text{concept\_links}, \text{signature\_embedding})$$

For example, across 20 conversations over a month, you systematically link two unrelated concepts (say, "Byzantine fault tolerance" and "sourdough fermentation") in a specific, unusual way. If a model later generates text that links these concepts in your characteristic pattern, that's signal.

### 2.2 Canary Deployment Protocol

```
┌─────────────────────────────────────────────────────────┐
│           CANARY LIFECYCLE                              │
│                                                         │
│  1. GENERATE     User creates canary (locally)          │
│       │          Canary hash registered on-chain        │
│       │          (timestamp proof of creation)          │
│       ▼                                                 │
│  2. BASELINE     Test all major models                  │
│       │          Confirm zero prior knowledge           │
│       │          Record baseline responses              │
│       │          Store baseline with timestamp proof    │
│       ▼                                                 │
│  3. DEPLOY       Introduce canary into AI conversations │
│       │          Natural integration, not forced         │
│       │          Record deployment context              │
│       │          On-chain commitment: H(canary‖context) │
│       ▼                                                 │
│  4. MONITOR      Periodically probe models              │
│       │          Compare responses to baseline          │
│       │          Statistical detection tests            │
│       │          Results logged to Sentinel dashboard   │
│       ▼                                                 │
│  5. DETECT       Alert if model shows canary knowledge  │
│       │          Generate evidence package              │
│       │          Escalate to user for decision          │
│       ▼                                                 │
│  6. EVIDENCE     Cryptographic proof bundle:            │
│                  - Canary creation timestamp (on-chain) │
│                  - Baseline responses (timestamped)     │
│                  - Detection responses (timestamped)    │
│                  - Statistical significance score       │
│                  - Provider and model version ID        │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Canary Registry (On-Chain)

The canary itself is **never** published. Only its hash:

$$\text{CanaryCommit} = \bigl(H(\text{canary} \| \text{DID}_u \| \text{salt}), \ t_{\text{created}}, \ \text{DID}_u, \ \sigma_u\bigr)$$

This proves:
- User $u$ created a canary before time $t_{\text{created}}$
- The canary is bound to $u$'s identity
- No one else can claim the canary later

If detection triggers, the user can selectively reveal the canary (with salt) to prove it matches the on-chain commitment.

### 2.4 Canary Density Budget

Too many canaries degrade the quality of the user's actual AI interactions. The system recommends:

$$\text{CanaryDensity} = \frac{|\text{canaries\_deployed}|}{|\text{total\_conversations}|} \leq \delta_{\text{max}}$$

Recommended $\delta_{\text{max}} = 0.05$ (at most 5% of conversations carry canaries).

The Sentinel client automatically manages canary placement:
- Higher density for providers with poor privacy track records
- Lower density for providers with strong contractual commitments
- Adaptive: increase density after model updates (when training is likely happening)

---

## III. Proactive Layer: Statistical Watermarks

### 3.1 Radioactive Data

Inspired by the "radioactive data" research paradigm (Sablayrolles et al., 2020): modify training data such that models trained on it carry a detectable statistical signature, without degrading the data quality.

**Principle:** Shift the distribution of the user's conversation embeddings in a specific, user-unique direction in embedding space. If a model is trained on this data, its internal representations will carry the directional shift.

**Mathematical framework:**

Let $\mathcal{D}_u = \{x_1, \ldots, x_n\}$ be the user's conversations (as text).

Let $\phi: \mathcal{X} \to \mathbb{R}^d$ be the embedding function of a reference model.

**Watermark direction (user-specific):**

$$\vec{w}_u = \text{Normalize}\bigl(\text{PRF}(sk_u, \texttt{"watermark-direction"})\bigr) \in \mathbb{S}^{d-1}$$

This is a pseudorandom unit vector in embedding space, unique to each user, derived from their secret key.

**Watermarking transformation:**

For each conversation $x_i$, create a slightly modified version $x_i'$ such that:

$$\phi(x_i') = \phi(x_i) + \epsilon \cdot \vec{w}_u$$

In practice, this means rephrasing parts of conversations so that their embeddings shift slightly toward $\vec{w}_u$. The shift $\epsilon$ is small enough that the semantic content is preserved but large enough to be statistically detectable.

**Detection test:**

Given a model $M$ suspected of training on $\mathcal{D}_u$:

1. Generate a set of probe inputs $\{q_1, \ldots, q_m\}$ related to the user's topics
2. Collect model responses: $\{M(q_j)\}_{j=1}^m$
3. Embed responses: $\{\phi(M(q_j))\}_{j=1}^m$
4. Compute directional statistic:

$$T_u = \frac{1}{m} \sum_{j=1}^m \langle \phi(M(q_j)), \vec{w}_u \rangle$$

5. Compare against null distribution (same test on models known NOT to have trained on user's data):

$$T_u^{\text{null}} = \frac{1}{m} \sum_{j=1}^m \langle \phi(M_{\text{control}}(q_j)), \vec{w}_u \rangle$$

**Detection criterion:**

$$\text{Detect}(M, u) = \begin{cases} 1 & \text{if } T_u - T_u^{\text{null}} > z_\alpha \cdot \hat{\sigma} \\ 0 & \text{otherwise} \end{cases}$$

Where $z_\alpha$ is the $z$-score for significance level $\alpha$ (e.g., $z_{0.01} = 2.576$).

### 3.2 Watermark Robustness

The watermark must survive the training pipeline: tokenization, batching, mixed with other data, gradient updates, potentially multiple epochs. Key robustness properties:

**Theorem (informal):** If a model trains on a dataset containing $\geq \gamma$ fraction of watermarked data from user $u$ for $\geq T$ gradient steps, the directional statistic $T_u$ exceeds the detection threshold with probability $\geq 1 - \delta$, where:

$$\gamma \cdot T \geq \frac{C \cdot d}{\epsilon^2} \cdot \ln\left(\frac{1}{\delta}\right)$$

for a constant $C$ depending on the model architecture and learning rate.

**Practical implication:** If a user has contributed even 0.1% of a training dataset and it was used for sufficient training steps, the watermark is detectable. For a user with 10,000 conversations in a training set of 10 million, $\gamma = 0.001$, which is detectable after approximately $10^4$ gradient steps — well within typical training runs.

### 3.3 Watermark-Canary Synergy

The canary system and the watermark system complement each other:

| Property | Canaries | Statistical Watermarks |
|----------|----------|----------------------|
| Detection granularity | Individual fact level | Corpus-level statistical |
| False positive rate | Near zero (unique facts) | Controllable via $\alpha$ |
| False negative rate | High (model may not memorize) | Low (statistical aggregation) |
| Robustness to deduplication | Low (exact matches filtered) | High (distributional, not exact) |
| Robustness to paraphrasing | Low | High |
| Evidence strength | Very strong (smoking gun) | Strong (statistical) |
| Required data volume | 1 canary enough | Need sufficient corpus volume |

**Combined detection confidence:**

$$P(\text{trained on user data} \mid \text{canary detected} \cup \text{watermark detected}) \geq 1 - (1-p_c)(1-p_w)$$

Where $p_c$ and $p_w$ are individual detection probabilities.

---

## IV. Detective Layer: Membership Inference Engine

### 4.1 The Core Question

> "Was my specific conversation $x$ in the training data of model $M$?"

This is the **membership inference** problem. The user has the conversation $x$ (from their VIVIM database). They have API access to model $M$. They want a yes/no answer with a confidence score.

### 4.2 Loss-Based Membership Inference

**Principle:** Training data typically has lower loss (higher likelihood) under the trained model than data the model hasn't seen.

**For a single conversation $x = (x_1, x_2, \ldots, x_L)$:**

$$\text{Loss}(M, x) = -\frac{1}{L} \sum_{i=1}^{L} \log P_M(x_i \mid x_{<i})$$

This is the per-token perplexity. If $x$ was in the training data:

$$\mathbb{E}[\text{Loss}(M, x_{\text{train}})] < \mathbb{E}[\text{Loss}(M, x_{\text{non-train}})]$$

**Calibrated membership inference (Carlini et al., 2022):**

Raw loss comparison is noisy because different texts have inherently different perplexities. A rare technical conversation will have higher loss than a common greeting regardless of training inclusion.

**Calibration using reference models:**

Let $M_{\text{ref}}$ be a reference model known NOT to have trained on $x$ (e.g., an older model version, or a model from a different provider):

$$\text{MIA\_Score}(M, x) = \text{Loss}(M_{\text{ref}}, x) - \text{Loss}(M, x)$$

If $x$ was in $M$'s training data but not $M_{\text{ref}}$'s, the target model will have disproportionately lower loss.

**Multi-reference calibration (more robust):**

$$\text{MIA\_Score}_k(M, x) = \frac{1}{k} \sum_{j=1}^{k} \text{Loss}(M_{\text{ref},j}, x) - \text{Loss}(M, x)$$

Using $k$ reference models reduces variance.

### 4.3 Perturbation-Based Membership Inference

**Principle:** If a model has memorized a specific text, it will be more sensitive to small perturbations of that exact text than to perturbations of text it hasn't seen.

**Algorithm:**

```
FUNCTION PerturbationMIA(M, x, n_perturbations=100):
    // Generate perturbations of x
    perturbed ← []
    FOR i = 1 TO n_perturbations:
        x_i' ← Perturb(x)  // Random word substitutions, 
                            // character swaps, reorderings
        perturbed.append(x_i')
    
    // Measure loss landscape curvature
    loss_original ← Loss(M, x)
    losses_perturbed ← [Loss(M, x_i') for x_i' in perturbed]
    
    // Training data has a sharp loss minimum at the exact text
    // (the model has "memorized" this specific sequence)
    curvature ← mean(losses_perturbed) - loss_original
    variance ← var(losses_perturbed)
    
    // High curvature + low variance = memorization signal
    memorization_score ← curvature / sqrt(variance + ε)
    
    RETURN memorization_score
```

**Detection criterion:**

$$\text{Detect}(M, x) = \mathbb{1}\left[\frac{\bar{L}_{\text{perturbed}} - L_{\text{original}}}{\hat{\sigma}_{\text{perturbed}}} > \tau_{\text{MIA}}\right]$$

### 4.4 Min-K% Probability Method

**Principle (Shi et al., 2024):** Examine the $k\%$ of tokens in the text that the model assigns the LOWEST probability. For memorized text, even the "hardest" tokens get relatively high probability. For unseen text, the hard tokens are genuinely hard.

$$\text{Min-K\%}(M, x) = \frac{1}{|S_k|} \sum_{i \in S_k} \log P_M(x_i \mid x_{<i})$$

Where $S_k$ is the set of token positions where $P_M(x_i \mid x_{<i})$ is in the bottom $k\%$.

**Advantage:** Does not require reference models. Works with API-only access (only needs log-probabilities, which many APIs provide).

### 4.5 VIVIM Sentinel MIA Pipeline

The Sentinel toolkit runs all methods in parallel and aggregates:

```
┌───────────────────────────────────────────────────────────┐
│               MEMBERSHIP INFERENCE PIPELINE               │
│                                                           │
│  INPUT: User's ACU (conversation x), Target model M       │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ Loss-Based  │  │Perturbation │  │  Min-K%          │  │
│  │ MIA         │  │ MIA         │  │  Probability     │  │
│  │             │  │             │  │                  │  │
│  │ Score: s₁   │  │ Score: s₂   │  │  Score: s₃       │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘  │
│         │                │                   │            │
│         └────────────────┼───────────────────┘            │
│                          │                                │
│                  ┌───────┴────────┐                       │
│                  │ META-CLASSIFIER│                       │
│                  │                │                       │
│                  │ Aggregates s₁, │                       │
│                  │ s₂, s₃ with   │                       │
│                  │ learned weights│                       │
│                  │                │                       │
│                  │ Calibrated on  │                       │
│                  │ known-member / │                       │
│                  │ known-non-     │                       │
│                  │ member data    │                       │
│                  └───────┬────────┘                       │
│                          │                                │
│                          ▼                                │
│                  ┌───────────────┐                        │
│                  │ RESULT:       │                        │
│                  │               │                        │
│                  │ Probability   │                        │
│                  │ that x was in │                        │
│                  │ M's training  │                        │
│                  │ data: p ∈[0,1]│                        │
│                  │               │                        │
│                  │ Confidence:   │                        │
│                  │ high/med/low  │                        │
│                  └───────────────┘                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Meta-classifier training:** VIVIM maintains a calibration dataset of known-member and known-non-member examples:
- Known members: Data users have sold through VIVIM marketplace (we know which models bought it)
- Known non-members: Data from time periods after a model's training cutoff

The meta-classifier is periodically retrained and its weights are open source.

### 4.6 Batch MIA: Scanning Your Entire Corpus

A user with 50,000 ACUs across 5 providers wants to know: "Which of my conversations are in GPT-4's training data?"

```
FUNCTION BatchMIA(user_u, model_M, corpus_A):
    results ← []
    
    // Sample stratified subset for efficiency
    // (full corpus scan may require millions of API calls)
    sample ← StratifiedSample(A, 
        strata = [provider, topic, time_period],
        sample_rate = 0.1)  // 10% sample
    
    FOR each ACU a ∈ sample:
        score ← SentinelMIA(M, a.body)
        results.append((a.id, a.provider, a.topic, a.timestamp, score))
    
    // Statistical extrapolation to full corpus
    FOR each stratum s:
        detected_rate_s ← mean(score > τ for results in stratum s)
        estimated_total_s ← detected_rate_s × |stratum s in full corpus|
    
    // Generate report
    RETURN MIAReport(
        total_scanned = |sample|,
        total_detected = sum(score > τ),
        estimated_corpus_exposure = sum(estimated_total_s),
        by_provider = group_by(results, provider),
        by_topic = group_by(results, topic),
        by_time = group_by(results, time_period),
        highest_confidence_detections = top_k(results, k=50)
    )
```

### 4.7 Rate Limiting and Cost Management

MIA testing requires querying target models. This costs money and may trigger rate limits.

**Cost model:**

$$\text{Cost}_{\text{MIA}}(n, k_{\text{pert}}, k_{\text{ref}}) = n \cdot (1 + k_{\text{pert}} + k_{\text{ref}}) \cdot c_{\text{per\_query}}$$

Where:
- $n$ = number of ACUs tested
- $k_{\text{pert}}$ = perturbations per ACU (e.g., 100)
- $k_{\text{ref}}$ = reference models
- $c_{\text{per\_query}}$ = cost per API call

For $n = 5000$, $k_{\text{pert}} = 50$, $k_{\text{ref}} = 3$, $c = \$0.001$:

$$\text{Cost} = 5000 \times (1 + 50 + 3) \times 0.001 = \$270$$

The Sentinel toolkit provides:
- Cost estimates before running
- Progressive scanning (most suspicious first)
- Caching and batching optimization
- Shared reference model baselines across VIVIM users (privacy-preserving)

---

## V. Detective Layer: Data Extraction Probing

### 5.1 The Extraction Test

Beyond asking "was my data used?" we can ask: "can the model **reproduce** my data?"

This is stronger evidence but also more concerning — it means the model has memorized the conversation verbatim.

**Prefix completion attack:**

Given a conversation $x = (x_1, \ldots, x_L)$, provide the first $k$ tokens as a prompt and check if the model completes with $x_{k+1}, \ldots, x_L$:

$$\hat{x}_{k+1:L} = M.\text{generate}(x_{1:k}, \text{temperature}=0)$$

$$\text{ExtractionScore}(M, x, k) = \frac{|\{i : \hat{x}_i = x_i, \ i \in [k+1, L]\}|}{L - k}$$

**Multi-prefix testing:**

Test with different prefix lengths to build a memorization profile:

$$\text{MemorizationProfile}(M, x) = \bigl[\text{ExtractionScore}(M, x, k)\bigr]_{k=1}^{L/2}$$

A sharp jump at some prefix length $k^*$ indicates the model has memorized the continuation — it needs $k^*$ tokens of context to "recall" the rest.

### 5.2 Contextual Extraction (More Subtle)

Rather than verbatim recall, test for contextual knowledge that could only come from the user's conversations:

```
FUNCTION ContextualExtraction(M, ACU_a):
    // Extract key entities, facts, preferences from the ACU
    entities ← ExtractEntities(a.body)
    preferences ← ExtractPreferences(a.body)
    solutions ← ExtractSolutions(a.body)
    
    // Craft probe queries that would only be answerable
    // if the model had seen this conversation
    probes ← []
    FOR each (entity, context) in entities:
        probe ← CraftProbe(entity, context)
        // Example: if user discussed a specific bug fix for
        // a specific library version, probe:
        // "How do you fix [specific error] in [library v X.Y.Z]
        //  when using [user's specific configuration]?"
        probes.append(probe)
    
    // Test
    FOR each probe in probes:
        response ← M.generate(probe)
        similarity ← SemanticSimilarity(response, expected_from_ACU)
        specificity ← MeasureSpecificity(response, probe)
        
        // High similarity + high specificity = likely trained on this data
        // High similarity + low specificity = could be general knowledge
    
    RETURN ContextualExtractionReport(probes, responses, scores)
```

### 5.3 Extraction Evidence Grading

| Grade | Criterion | Evidence Strength |
|-------|-----------|-------------------|
| **A — Verbatim Recall** | Model reproduces >80% of conversation text from prefix | Definitive |
| **B — Near-Verbatim** | Model reproduces paraphrased version with same structure | Very strong |
| **C — Specific Knowledge** | Model knows facts/solutions unique to user's conversation | Strong |
| **D — Stylistic Echo** | Model's outputs show statistical influence from user's writing style | Moderate |
| **E — Topic Familiarity** | Model shows elevated competence in user's specific topic area | Suggestive |

---

## VI. Detective Layer: Behavioral Fingerprinting

### 6.1 Cross-Model Differential Analysis

If a user's data was used by Provider A but not Provider B, then querying both with the same probes should reveal differential knowledge:

$$\Delta(q) = \text{Relevance}(M_A(q), x_u) - \text{Relevance}(M_B(q), x_u)$$

Where $x_u$ is the user's conversation and $q$ is a probe query.

**Systematic differential testing:**

```
FUNCTION DifferentialAnalysis(models[], ACUs[], n_probes=50):
    differential_matrix ← zeros(|models|, |ACUs|)
    
    FOR each ACU a:
        probes ← GenerateProbes(a, n_probes)
        FOR each model M_i:
            scores_i ← [Relevance(M_i(q), a) for q in probes]
            differential_matrix[i][a] ← mean(scores_i)
    
    // Normalize: subtract column mean (baseline topic knowledge)
    FOR each ACU a:
        col_mean ← mean(differential_matrix[:][a])
        differential_matrix[:][a] -= col_mean
    
    // Positive values = this model knows MORE about this ACU
    // than average across models
    // Strong positive = likely trained on this data
    
    RETURN DifferentialReport(
        per_model = {M_i: top_k_ACUs_with_highest_differential},
        per_ACU = {a: models_ranked_by_differential},
        statistical_tests = {chi_squared, mann_whitney, etc.}
    )
```

### 6.2 Model Update Tracking

When a model is updated (new version, fine-tuned, etc.), re-run detection tests and compare:

$$\Delta_{\text{update}}(M, M', x_u) = \text{MIA\_Score}(M', x_u) - \text{MIA\_Score}(M, x_u)$$

If $\Delta_{\text{update}} > 0$ significantly, the new model version may have been trained on the user's data.

**The Sentinel timeline:**

```
Model Version    MIA Score    Canary    Watermark    Assessment
─────────────    ─────────    ──────    ─────────    ──────────
GPT-4 (Mar 23)     0.12       ✗          ✗          No evidence
GPT-4 (Jun 23)     0.15       ✗          ✗          No evidence  
GPT-4 Turbo        0.43       ✗          ✗          SUSPICIOUS ⚠️
GPT-4o             0.67       ✓ (1)      ✓          LIKELY TRAINED ⛔
GPT-4o-mini        0.71       ✓ (3)      ✓          CONFIRMED ⛔
```

This gives users a **temporal map** of when their data entered each model's training pipeline.

### 6.3 Provider API Pattern Analysis

Beyond model-level detection, analyze provider API behavior for signs of data use:

**Signal 1: Recommendation Correlation**

If a provider starts recommending topics/features that correlate with your conversation history — even conversations you had months ago — that's evidence your history is being processed beyond the session.

**Signal 2: Cross-Session Knowledge**

If you opted out of training but the model shows knowledge from previous sessions (beyond what's in the context window), your data is being retained and used.

**Signal 3: A/B Testing Detection**

If the model's behavior toward you differs from its behavior toward a fresh account asking the same questions, your identity/history is influencing the response — meaning your data is active in their system.

```
FUNCTION ABTestDetection(M, queries[]):
    // Create fresh anonymous account
    anon_session ← CreateAnonymousSession(M)
    
    // Query with user's account and anonymous account
    FOR each q in queries:
        response_user ← M.query(q, session=user_session)
        response_anon ← M.query(q, session=anon_session)
        
        divergence ← SemanticDistance(response_user, response_anon)
        personalization_score ← divergence
    
    // High divergence on non-personal queries = 
    // your history is influencing responses
    RETURN PersonalizationReport(scores)
```

---

## VII. Monitoring Layer: The Privacy Monitor

### 7.1 For Data the User Has Chosen NOT to Share

This is the most critical tool. The user has explicitly kept certain data private — off-chain, never listed, never sold. The Privacy Monitor continuously verifies that this data remains private.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│              PRIVACY MONITOR (Background Service)         │
│                                                          │
│  ┌────────────────┐                                      │
│  │ USER'S PRIVATE │     Never leaves device except       │
│  │ DATA VAULT     │     as probe queries                 │
│  │                │                                      │
│  │ • Conversations│     ┌──────────────────────────┐     │
│  │   marked       │────►│ PROBE GENERATOR          │     │
│  │   "never share"│     │                          │     │
│  │ • Sensitive    │     │ Creates queries that test │     │
│  │   topics       │     │ for specific knowledge   │     │
│  │ • Personal     │     │ without revealing the    │     │
│  │   information  │     │ actual data              │     │
│  │                │     └───────────┬──────────────┘     │
│  └────────────────┘                 │                     │
│                                     ▼                     │
│                           ┌─────────────────┐            │
│                           │ PROBE SCHEDULER │            │
│                           │                 │            │
│                           │ Rate-limited    │            │
│                           │ Randomized      │            │
│                           │ Cost-managed    │            │
│                           └────────┬────────┘            │
│                                    │                      │
│            ┌───────────────────────┼──────────────────┐   │
│            ▼                       ▼                  ▼   │
│     ┌────────────┐         ┌────────────┐     ┌────────┐ │
│     │  OpenAI    │         │  Anthropic │     │ Google │ │
│     │  API       │         │  API       │     │ API    │ │
│     └─────┬──────┘         └─────┬──────┘     └───┬────┘ │
│           │                      │                │      │
│           └──────────────────────┼────────────────┘      │
│                                  ▼                        │
│                        ┌─────────────────┐               │
│                        │ RESPONSE        │               │
│                        │ ANALYZER        │               │
│                        │                 │               │
│                        │ MIA tests       │               │
│                        │ Canary checks   │               │
│                        │ Extraction tests│               │
│                        │ Statistical     │               │
│                        │ comparison      │               │
│                        └────────┬────────┘               │
│                                 │                         │
│                                 ▼                         │
│                        ┌─────────────────┐               │
│                        │ ALERT ENGINE    │               │
│                        │                 │               │
│                        │ ● Green: clean  │               │
│                        │ ● Yellow: watch │               │
│                        │ ● Red: detected │               │
│                        └─────────────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 7.2 Privacy-Preserving Probe Generation

Critical constraint: The probes sent to AI APIs must not **themselves** leak the private data. If the probe is "Did you know that on March 5th I told ChatGPT about my medical condition X?", we've just told Claude about the medical condition.

**Solution: Indirect probing**

```
FUNCTION GeneratePrivacyPreservingProbe(private_ACU_a):
    // Extract the TOPIC without the CONTENT
    topic_abstraction ← AbstractTopic(a)
    // e.g., a is about "debugging memory leak in my company's 
    //        proprietary trading system using Rust"
    // abstraction: "debugging memory issues in Rust systems"
    
    // Extract STRUCTURAL features without SEMANTIC content
    structural_features ← (
        conversation_length = a.turns,
        question_types = ClassifyQuestionTypes(a),
        solution_pattern = AbstractSolutionPattern(a),
        technical_depth = a.depth
    )
    
    // Generate probes that test for the SPECIFIC knowledge
    // without revealing the specific context
    
    // Type 1: Topic probe (safe - general topic)
    probe_topic ← f"Explain how to debug {topic_abstraction}"
    
    // Type 2: Unique solution probe (moderate - tests specific approach)
    // Only if the user's conversation contained a unique solution
    unique_elements ← ExtractUniqueElements(a)
    IF unique_elements:
        // Probe for the specific solution without stating it
        probe_solution ← CraftIndirectProbe(unique_elements)
        // e.g., "What's an unusual approach to debugging X 
        //  that involves technique Y?"
        // where technique Y was the user's novel approach
    
    // Type 3: Canary check (if canaries were deployed)
    IF a.has_canary:
        probe_canary ← a.canary.detection_prompt
    
    RETURN probes (filtered for privacy safety)
```

**Probe privacy audit:** Before any probe is sent, it passes through a local privacy filter:

$$\text{PrivacySafe}(q, a) = \begin{cases} 1 & \text{if } \text{InformationLeakage}(q, a) < \theta_{\text{privacy}} \\ 0 & \text{otherwise} \end{cases}$$

Where $\text{InformationLeakage}$ measures mutual information between the probe query and the private ACU content. Only probes with leakage below threshold are dispatched.

### 7.3 Monitoring Schedule

Not all private data needs the same monitoring intensity:

$$\text{MonitoringPriority}(a) = \text{Sensitivity}(a) \times \text{Recency}(a) \times \text{ExposureRisk}(a)$$

Where:
- $\text{Sensitivity}(a) \in [0, 4]$: User's sensitivity classification
- $\text{Recency}(a) = e^{-\lambda(t_{\text{now}} - a.\text{ts})}$: Recent data more likely to be in recent training
- $\text{ExposureRisk}(a)$: Based on the provider's privacy track record

**Scanning schedule:**

| Priority Band | Frequency | Sample Rate |
|---|---|---|
| Critical (sensitivity=4, recent, risky provider) | Weekly | 100% of band |
| High (sensitivity=3 OR very recent) | Bi-weekly | 50% of band |
| Medium (sensitivity=2, within 6 months) | Monthly | 20% of band |
| Low (sensitivity ≤1, older than 6 months) | Quarterly | 5% of band |

### 7.4 Cross-Provider Leak Detection

The most insidious scenario: you had a private conversation with Provider A, never shared it, but Provider B somehow shows knowledge of it. This could happen through:

- Shared investors demanding data sharing agreements
- Acquisition (one company buys another and merges training data)
- Employees moving between companies
- Third-party data brokers aggregating API logs
- Browser extensions or integrations leaking data

**Detection:**

```
FUNCTION CrossProviderLeakDetection(private_ACU_a, original_provider_p):
    // a was ONLY shared with provider p
    // Test ALL OTHER providers
    
    FOR each provider p' ≠ p:
        FOR each model M in p'.models:
            mia_score ← SentinelMIA(M, a.body)
            extraction_score ← ExtractionTest(M, a.body)
            
            IF mia_score > τ_high OR extraction_score > τ_extract:
                // This model from a DIFFERENT provider shows 
                // knowledge of data that should only exist at 
                // the original provider
                ALERT(
                    type = "CROSS_PROVIDER_LEAK",
                    severity = "CRITICAL",
                    source = p,
                    leaker = p',
                    model = M,
                    evidence = (mia_score, extraction_score),
                    ACU = a.id
                )
    
    RETURN CrossProviderReport(results)
```

This is nuclear-level detection. A confirmed cross-provider leak is evidence of either unauthorized data sharing between companies or a data breach.

---

## VIII. Monitoring Layer: Consent Violation Detector (On-Chain Data)

### 8.1 For Data the User HAS Sold

When a user sells data through the VIVIM marketplace, they specify exact permissions (§7.2 of the blockchain architecture). The Consent Violation Detector checks whether buyers are violating those permissions.

**Violation types:**

| Permission Granted | Violation | Detection Method |
|---|---|---|
| `READ` only | Buyer uses data for training | MIA on buyer's model |
| `AGGREGATE` only | Buyer publishes individual records | Content monitoring |
| `EMBED` only | Buyer trains on raw text | MIA + extraction tests |
| `TRAIN` (specific model) | Buyer trains a different model | Multi-model MIA |
| `TRAIN` (time-limited) | Buyer continues using after expiry | Post-expiry MIA |
| Any | Buyer resells without `RESELL` permission | Marketplace monitoring + watermark detection in third-party models |
| Any (exclusive) | Buyer shares with unauthorized parties | Watermark detection |

### 8.2 Post-Sale Monitoring Pipeline

```
FUNCTION ConsentComplianceMonitor(user_u):
    active_consents ← GetActiveConsents(DID_u)
    
    FOR each consent C in active_consents:
        buyer ← C.buyer
        permissions ← C.permissions
        ACUs_sold ← C.ACU_set
        
        // Test 1: Is the buyer's model trained on more data 
        // than they purchased?
        IF "TRAIN" in permissions:
            // Check if buyer's model shows knowledge of ACUs
            // NOT included in the consent
            unsold_ACUs ← user_u.corpus - ACUs_sold
            FOR sample_a in Sample(unsold_ACUs):
                IF MIA(buyer.model, sample_a) > τ:
                    ALERT("SCOPE_VIOLATION: Buyer may have used 
                           data beyond consent scope")
        
        // Test 2: Has the buyer exceeded temporal bounds?
        IF t_now > C.expiry:
            IF MIA(buyer.model_current, ACUs_sold) > 
               MIA(buyer.model_at_expiry, ACUs_sold) + δ:
                ALERT("TEMPORAL_VIOLATION: Buyer continued training 
                       after consent expiry")
        
        // Test 3: Has the buyer resold?
        IF "RESELL" ∉ permissions:
            // Check third-party models for watermark presence
            FOR model M in ThirdPartyModels:
                IF WatermarkDetect(M, user_u.watermark_direction) > τ_wm:
                    ALERT("RESELL_VIOLATION: User's watermarked data 
                           detected in third-party model")
        
        // Test 4: Has the buyer published raw data?
        IF "PUBLISH" ∉ permissions:
            // Search public datasets and training data releases
            matches ← SearchPublicCorpora(ACUs_sold.fingerprints)
            IF matches:
                ALERT("PUBLISH_VIOLATION: Sold data found in public 
                       dataset")
```

### 8.3 Violation Evidence Package

When a violation is detected, the system generates a cryptographically verifiable evidence package:

$$\text{Evidence} = \bigl(\text{consent\_id}, \text{violation\_type}, \text{detection\_results}, \text{timeline}, \text{proofs}\bigr)$$

**Contents:**

1. **Consent record** (from chain): What was agreed
2. **Detection results**: MIA scores, canary detections, watermark results
3. **Temporal proofs**: 
   - Baseline scores before sale (pre-consent)
   - Score changes after sale (post-consent)
   - Current scores (violation detection)
4. **Statistical analysis**: Significance tests, false positive probability
5. **Cryptographic anchors**: All scores are timestamped and committed to chain via:

$$H(\text{detection\_result} \| t \| \text{DID}_u) \to \text{chain}$$

This evidence package is admissible in the VIVIM dispute system and designed to be translatable to legal proceedings.

---

## IX. Evidence Layer: Temporal Proof Engine

### 9.1 Proving "I Had This Data First"

The most fundamental legal question in unauthorized data use: **Can the user prove the data was theirs before the model was trained on it?**

VIVIM's blockchain architecture provides this through temporal commitments:

```
USER'S PROOF OF PRIOR OWNERSHIP
────────────────────────────────

Block #1,000 (January 15, 2024):
  MemoryCommit(DID_u, R_u = 0xabc..., n=5000)
  ↓
  This commits: "User u had exactly these 5000 ACUs 
  at this time, with this Merkle root"

Block #50,000 (June 1, 2024):
  Model X announces training data cutoff: May 2024

Block #60,000 (July 15, 2024):
  User runs MIA → detects data in Model X

PROOF:
  1. ACU a_i was in user's MMR at block #1,000 
     (Merkle inclusion proof against R_u committed at block #1,000)
  2. Block #1,000 timestamp precedes Model X training cutoff
  3. MIA detects a_i in Model X at block #60,000
  4. No ConsentGrant from DID_u to Model X's operator exists on chain
  ∴ Model X used user's data without consent
```

### 9.2 Temporal Proof Construction

$$\pi_{\text{temporal}} = \bigl(\underbrace{h_{a_i}, \text{MerklePath}(h_{a_i}, R_u)}_{\text{data existed in corpus}}, \ \underbrace{R_u, B_k, \text{BlockProof}(B_k)}_{\text{at this blockchain time}}, \ \underbrace{\text{MIA\_Result}(M, a_i)}_{\text{model shows knowledge}}, \ \underbrace{\neg \exists C : C.u = u \land C.b = \text{operator}(M)}_{\text{no consent exists}}\bigr)$$

Each element is independently verifiable:
- Merkle proof: verifiable against on-chain $R_u$
- Block proof: verifiable against chain state
- MIA result: reproducible (given model API access)
- Consent absence: verifiable on-chain (exhaustive search of consent records for $\text{DID}_u$)

### 9.3 Proof Strength Classification

| Evidence Components Present | Proof Strength | Legal Utility |
|---|---|---|
| Temporal commitment + MIA + No consent | Strong | Civil litigation viable |
| Temporal commitment + Canary detection + No consent | Very strong | Strong civil case |
| Temporal commitment + Verbatim extraction + No consent | Definitive | Copyright infringement case |
| Temporal commitment + Cross-provider leak + No consent | Critical | Multiple legal theories |
| All of the above | Overwhelming | Class action material |

---

## X. Evidence Layer: Damage Assessment Calculator

### 10.1 Quantifying Unauthorized Use

When a user discovers unauthorized use, they need to understand the **economic damage** — both for dispute resolution within VIVIM and for potential legal action.

**Damage model:**

$$D_{\text{total}} = D_{\text{market}} + D_{\text{opportunity}} + D_{\text{privacy}} + D_{\text{punitive}}$$

**Market value damage (what the data would have been worth):**

$$D_{\text{market}} = \sum_{a \in \text{used\_ACUs}} V(a) \cdot \text{ExclusivityMultiplier}$$

Using the valuation model from the blockchain architecture (§10.2 of the chain spec), with the exclusivity multiplier reflecting that the model operator used the data without any negotiation — meaning the user lost the opportunity to sell exclusively.

**Opportunity damage (lost future sales):**

$$D_{\text{opportunity}} = D_{\text{market}} \cdot \frac{\gamma}{1-\gamma} \cdot (1 - e^{-\lambda_f T_{\text{remaining}}})$$

Where $T_{\text{remaining}}$ is the remaining useful life of the data and $\gamma$ is the expected future sale probability.

**Privacy damage (for sensitive data):**

$$D_{\text{privacy}} = \sum_{a \in \text{used\_ACUs}} \text{SensitivityCost}(\text{sensitivity}(a))$$

Where:

| Sensitivity Level | Per-ACU Privacy Damage |
|---|---|
| 0 (public) | 0 |
| 1 (general) | $\beta_1$ |
| 2 (professional) | $\beta_2$ |
| 3 (confidential) | $\beta_3$ |
| 4 (highly sensitive — medical, legal, financial) | $\beta_4$ |

With $\beta_4 \gg \beta_3 \gg \beta_2 \gg \beta_1$.

**Punitive multiplier (for egregious violations):**

$$D_{\text{punitive}} = (D_{\text{market}} + D_{\text{opportunity}} + D_{\text{privacy}}) \cdot \mu$$

Where $\mu$ is a governance-set multiplier for:
- Data used despite explicit opt-out ($\mu_{\text{opt-out}} = 3\times$)
- Cross-provider data sharing without disclosure ($\mu_{\text{cross}} = 5\times$)
- Sensitive data categories ($\mu_{\text{sensitive}} = 2\times$)
- Repeat offender ($\mu_{\text{repeat}} = 2\times$ compounding)

### 10.2 User Dashboard: Exposure Report

```
╔══════════════════════════════════════════════════════════╗
║            VIVIM SENTINEL — EXPOSURE REPORT              ║
║            User: did:vivim:7xK2m...  Date: 2026-03-15   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  TOTAL CORPUS: 47,832 ACUs across 6 providers            ║
║                                                          ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │  PROVIDER EXPOSURE MAP                           │    ║
║  │                                                  │    ║
║  │  OpenAI (ChatGPT)                                │    ║
║  │  ████████████████████████ 12,403 ACUs            │    ║
║  │  ⛔ GPT-4o: 89% likely trained (MIA: 0.87)      │    ║
║  │  ⛔ GPT-4o-mini: 91% likely (MIA: 0.91)         │    ║
║  │  ⚠️ o1: 34% possible (MIA: 0.34)                │    ║
║  │  ✅ DALL-E: No evidence                          │    ║
║  │                                                  │    ║
║  │  Anthropic (Claude)                              │    ║
║  │  ██████████████████ 9,201 ACUs                   │    ║
║  │  ⚠️ Claude 3.5: 28% possible (MIA: 0.28)        │    ║
║  │  ✅ Claude 3 Opus: No evidence                   │    ║
║  │                                                  │    ║
║  │  Google (Gemini)                                 │    ║
║  │  ████████████████████ 10,885 ACUs                │    ║
║  │  ⛔ Gemini 1.5 Pro: 72% likely (MIA: 0.72)      │    ║
║  │  ⛔ Gemini 1.5 Flash: 78% likely (MIA: 0.78)    │    ║
║  │                                                  │    ║
║  │  Cursor (IDE)                                    │    ║
║  │  ██████████ 6,720 ACUs                           │    ║
║  │  ⚠️ Unknown routing (queries may have gone       │    ║
║  │     to OpenAI, Anthropic, or Google)             │    ║
║  │                                                  │    ║
║  │  Perplexity                                      │    ║
║  │  ████████ 5,103 ACUs                             │    ║
║  │  ✅ No evidence of training use                  │    ║
║  │                                                  │    ║
║  │  Ollama (Local)                                  │    ║
║  │  ██████ 3,520 ACUs                               │    ║
║  │  ✅ Local only — not exposed                     │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                          ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │  CANARY STATUS                                   │    ║
║  │                                                  │    ║
║  │  Deployed: 142 canaries across 4 providers       │    ║
║  │  Detected: 7 canaries in 2 models                │    ║
║  │    ⛔ 5 detected in GPT-4o (OpenAI data)         │    ║
║  │    ⛔ 2 detected in Gemini 1.5 (Google data)     │    ║
║  │  Clean: 135 canaries undetected                  │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                          ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │  WATERMARK STATUS                                │    ║
║  │                                                  │    ║
║  │  Watermark active on: 31,209 ACUs                │    ║
║  │  Detected in:                                    │    ║
║  │    ⛔ GPT-4o family (p < 0.001)                  │    ║
║  │    ⛔ Gemini 1.5 family (p < 0.01)               │    ║
║  │    ✅ Claude family (p > 0.3, not significant)   │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                          ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │  PRIVATE DATA MONITOR                            │    ║
║  │                                                  │    ║
║  │  Monitored private ACUs: 8,441                   │    ║
║  │  ✅ No private data detected in any model        │    ║
║  │  Last full scan: 2026-03-12                      │    ║
║  │  Next scheduled: 2026-03-19                      │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                          ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │  ESTIMATED EXPOSURE VALUE                        │    ║
║  │                                                  │    ║
║  │  Market value of likely-exposed data:  4,821 VIV │    ║
║  │  Opportunity cost:                     2,107 VIV │    ║
║  │  Privacy damage (sensitivity-weighted): 890 VIV  │    ║
║  │  ─────────────────────────────────────────────── │    ║
║  │  TOTAL ESTIMATED DAMAGE:               7,818 VIV │    ║
║  │                                                  │    ║
║  │  [Generate Evidence Package]  [File Dispute]     │    ║
║  └──────────────────────────────────────────────────┘    ║
║                                                          ║
║  ┌──────────────────────────────────────────────────┐    ║
║  │  CONSENT COMPLIANCE (On-Chain Sales)             │    ║
║  │                                                  │    ║
║  │  Active consents: 12                             │    ║
║  │  ✅ All within scope                             │    ║
║  │  ✅ No temporal violations                       │    ║
║  │  ✅ No resell violations detected                │    ║
║  └──────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════╝
```

---

## XI. Evidence Layer: Legal Evidence Package Generator

### 11.1 Package Structure

When a user wants to take action — filing a VIVIM on-chain dispute, reporting to a data protection authority, or engaging legal counsel — the system generates a complete, self-contained evidence package.

```
vivim-evidence-package-{DID_u}-{timestamp}/
│
├── 00-SUMMARY.pdf
│   Human-readable summary of findings
│   Executive overview for legal counsel
│
├── 01-IDENTITY/
│   ├── did-document.json          (User's DID document)
│   ├── public-key.pem             (User's public key)
│   └── identity-attestation.json  (Optional: verified identity link)
│
├── 02-DATA-OWNERSHIP/
│   ├── memory-root-commitments/
│   │   ├── block-1000.json        (Earliest relevant commitment)
│   │   ├── block-5000.json        (Pre-training-cutoff commitment)
│   │   └── ...
│   ├── merkle-proofs/
│   │   ├── acu-{id1}-inclusion.json
│   │   ├── acu-{id2}-inclusion.json
│   │   └── ...                    (Proofs that specific ACUs existed)
│   └── temporal-analysis.json     (Timeline of data creation vs. training)
│
├── 03-DETECTION-RESULTS/
│   ├── membership-inference/
│   │   ├── mia-results-{model}.json   (Per-model MIA scores)
│   │   ├── statistical-analysis.json  (Significance tests)
│   │   └── methodology.md            (Reproducibility notes)
│   ├── canary-detection/
│   │   ├── canary-deployments.json    (When/where canaries were placed)
│   │   ├── canary-detections.json     (Which were found, in which models)
│   │   ├── canary-creation-proofs/    (On-chain commitments)
│   │   └── baseline-records/         (Pre-deployment model responses)
│   ├── watermark-detection/
│   │   ├── watermark-results.json
│   │   └── statistical-significance.json
│   └── extraction-results/
│       ├── verbatim-extractions.json  (If any)
│       └── contextual-extractions.json
│
├── 04-CONSENT-RECORD/
│   ├── all-consents.json          (Every consent ever granted by user)
│   ├── absence-proof.json         (Proof no consent exists for violator)
│   └── chain-state-snapshot.json  (Blockchain state at time of report)
│
├── 05-DAMAGE-ASSESSMENT/
│   ├── valuation.json             (Per-ACU and total value)
│   ├── methodology.md            (Valuation model explanation)
│   └── market-comparables.json    (Similar data sale prices on VIVIM)
│
├── 06-CRYPTOGRAPHIC-PROOFS/
│   ├── proof-bundle.json          (All ZK proofs, Merkle proofs)
│   ├── verification-script.py     (Script to verify all proofs)
│   └── hash-chain.json            (Sequential hash of all evidence)
│
└── 07-METADATA/
    ├── generation-timestamp.json  (When this package was created)
    ├── generator-version.json     (Sentinel toolkit version)
    ├── signature.json             (User's signature over entire package)
    └── integrity-hash.json        (H(entire package contents))
```

### 11.2 Evidence Chain of Custody

The evidence package itself is cryptographically signed and timestamped:

$$\sigma_{\text{package}} = \text{Sign}\bigl(sk_u, H(\text{all\_contents})\bigr)$$

$$\text{Tx}_{\text{evidence}} = (\text{DID}_u, H(\text{package}), t, \sigma_{\text{package}})$$

This creates an immutable record: the user produced this exact evidence at this exact time. If the model operator later modifies their model or deletes data, the evidence package is already anchored.

---

## XII. Collective Intelligence: The Sentinel Network

### 12.1 The Power of Collective Detection

Individual users have limited API budgets and statistical power. But a network of users running Sentinel can detect patterns that no individual could:

**Collective MIA:** If 10,000 users each test a small sample of their data against a model, the combined results reveal the model's training data composition with high confidence.

**Collective canary coverage:** With 100,000 users each deploying 10 canaries across 5 providers, the network has 1,000,000 canaries deployed — enough to detect training data inclusion with near-certainty.

**Collective watermark detection:** Individual watermarks may be too weak to detect. But if the Sentinel network aggregates directional statistics across users (without revealing individual data), the combined signal is overwhelmingly strong.

### 12.2 Privacy-Preserving Aggregation

Users share detection **results**, not **data**:

$$\text{SharedResult}_u = (\text{model\_id}, \text{mia\_score}, \text{canary\_hit}, \text{watermark\_score}, \text{DID}_u)$$

**Federated aggregation protocol:**

```
FUNCTION CollectiveSentinelReport(model_M):
    // Each user computes locally
    individual_results ← {} // collected via P2P gossip
    
    FOR each participating user u:
        result_u ← u.sentinel.test(M)
        // User signs and publishes their result
        signed_result ← Sign(sk_u, result_u)
        BroadcastToNetwork(signed_result)
    
    // Aggregation (by any node)
    all_results ← CollectSignedResults()
    
    // Aggregate statistics
    avg_mia ← mean([r.mia_score for r in all_results])
    canary_rate ← sum([r.canary_hit for r in all_results]) / |all_results|
    watermark_aggregate ← CombinedWatermarkTest(all_results)
    
    // Statistical test
    p_value ← WilcoxonSignedRank(
        [r.mia_score for r in all_results],
        null_hypothesis = "no training on user data"
    )
    
    // Publish collective report
    CollectiveReport ← (
        model = M,
        participants = |all_results|,
        avg_mia = avg_mia,
        canary_detection_rate = canary_rate,
        watermark_significance = watermark_aggregate,
        p_value = p_value,
        conclusion = Classify(p_value, canary_rate)
    )
    
    // Commit to chain
    Tx ← (H(CollectiveReport), t, signatures_of_aggregators)
    
    RETURN CollectiveReport
```

### 12.3 The Sentinel Leaderboard (Model Transparency Score)

The collective results produce a public **Model Transparency Score** for every AI model:

```
╔══════════════════════════════════════════════════════════════╗
║           VIVIM SENTINEL — MODEL TRANSPARENCY INDEX          ║
║           Updated: 2026-03-15  |  42,891 participants       ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Model               Users  MIA    Canary  Wmark  Score      ║
║  ────────────────────────────────────────────────────────     ║
║  Llama 3.1 405B      8,201  0.08   0/824   n.s.   ✅ 94/100 ║
║  Claude 3.5 Sonnet   12,403 0.12   0/1,102 n.s.   ✅ 91/100 ║
║  Mistral Large       3,892  0.15   0/412   n.s.   ✅ 88/100 ║
║  Claude 3 Opus       9,876  0.18   1/987   n.s.   ✅ 85/100 ║
║  Gemini 1.5 Pro      11,208 0.52   12/1,024 *     ⚠️ 38/100 ║
║  GPT-4o              15,891 0.78   89/1,503 ***   ⛔ 12/100 ║
║  GPT-4o-mini         14,203 0.82   103/1,411 ***  ⛔  8/100 ║
║                                                              ║
║  * p < 0.05   ** p < 0.01   *** p < 0.001                   ║
║                                                              ║
║  Methodology: Open source (github.com/vivim/sentinel)       ║
║  Raw data: Available via VIVIM API                           ║
║  Disputes: Model operators can contest with counter-evidence ║
╚══════════════════════════════════════════════════════════════╝
```

This becomes a **public good** — a credible, crowdsourced, cryptographically anchored assessment of which AI companies respect user data and which don't. The transparency index creates market pressure: companies that score poorly lose users to companies that score well.

---

## XIII. Tools for Private Data (Never-Shared)

### 13.1 The Paradox

For data the user has **never shared through VIVIM** but has shared with AI providers through normal use (before VIVIM existed, or alongside VIVIM), the question is:

> "My private data was given to an AI company through their normal chat interface. They said they'd use it for training (or didn't say they wouldn't). I now want to know if they actually did."

This isn't a VIVIM consent violation — it's a provider terms-of-service / privacy regulation question. But VIVIM can give users the tools to **know**.

### 13.2 Retroactive Detection Toolkit

For conversations the user had **before joining VIVIM** (historical data imported via the provider parsers):

```
FUNCTION RetroactiveExposureAnalysis(user_u):
    // Phase 1: Import all historical conversations
    historical ← ImportAllProviders(user_u)
    
    // Phase 2: Establish current baseline
    // For each provider, test if their current models 
    // show knowledge of the user's conversations
    exposure_map ← {}
    
    FOR each provider p in historical.providers:
        user_convos_with_p ← historical.filter(provider=p)
        
        FOR each model M operated by p:
            // Sample and test
            sample ← RandomSample(user_convos_with_p, n=500)
            mia_scores ← [MIA(M, conv) for conv in sample]
            
            // Statistical test against null
            // Null: these conversations are NOT in training data
            // Use conversations with OTHER providers as control
            control_convos ← historical.filter(provider≠p)
            control_sample ← RandomSample(control_convos, n=500)
            control_scores ← [MIA(M, conv) for conv in control_sample]
            
            // Mann-Whitney U test
            U, p_value ← MannWhitneyU(mia_scores, control_scores)
            
            exposure_map[p][M] = {
                mean_mia: mean(mia_scores),
                control_mia: mean(control_scores),
                differential: mean(mia_scores) - mean(control_scores),
                p_value: p_value,
                estimated_fraction_exposed: 
                    EstimateExposedFraction(mia_scores, threshold)
            }
    
    // Phase 3: Cross-provider check
    // Test if Provider A's models know about conversations 
    // the user had with Provider B
    FOR each pair (p_source, p_target) where p_source ≠ p_target:
        cross_convos ← historical.filter(provider=p_source)
        FOR each model M operated by p_target:
            mia_scores ← [MIA(M, conv) for conv in Sample(cross_convos)]
            IF mean(mia_scores) > threshold:
                ALERT("CROSS-PROVIDER EXPOSURE: Conversations from 
                       {p_source} may be in {p_target}'s model {M}")
    
    RETURN RetroactiveReport(exposure_map, cross_provider_alerts)
```

### 13.3 The Opt-Out Verifier

Most providers now offer "don't use my data for training" opt-outs. But users have no way to verify compliance. The Sentinel toolkit provides this:

```
FUNCTION OptOutVerifier(user_u, provider_p):
    // Step 1: Identify when user opted out
    opt_out_date ← user_u.opt_out_records[p]
    
    // Step 2: Split conversations into pre-opt-out and post-opt-out
    pre_optout ← user_u.convos.filter(
        provider=p, date < opt_out_date)
    post_optout ← user_u.convos.filter(
        provider=p, date > opt_out_date)
    
    // Step 3: For each model version released AFTER opt-out date
    model_versions ← GetModelVersionsAfter(p, opt_out_date)
    
    FOR each model M_v in model_versions:
        // Pre-opt-out data: might be in training (was collected 
        // before opt-out, may have been included)
        pre_mia ← BatchMIA(M_v, pre_optout)
        
        // Post-opt-out data: should NOT be in training
        post_mia ← BatchMIA(M_v, post_optout)
        
        IF mean(post_mia) > threshold:
            ALERT("OPT-OUT VIOLATION: Provider {p} appears to have 
                   trained model {M_v} on conversations created 
                   AFTER user opted out of training data use.
                   
                   Opt-out date: {opt_out_date}
                   Model release: {M_v.release_date}
                   Post-opt-out MIA: {mean(post_mia)} (threshold: {threshold})
                   
                   This is a potential violation of:
                   - Provider's own terms of service
                   - GDPR Article 21 (right to object)
                   - CCPA right to opt-out of sale")
    
    RETURN OptOutComplianceReport(results)
```

### 13.4 Data Deletion Verifier

Under GDPR, CCPA, and other regulations, users can request deletion of their data. But how do you verify a company actually deleted it from training data?

**The uncomfortable answer:** You can't verify deletion from a trained model. Once data influences gradient updates, the model's weights are permanently altered. "Deleting" training data after training is like "un-stirring" cream from coffee.

**What Sentinel CAN verify:**

1. **Future model versions:** If you requested deletion in March, and a model released in September still shows MIA signal for your data, either:
   - They didn't delete it before retraining
   - They retrained on a dataset that still contained it
   - The MIA signal is a false positive (quantify this probability)

2. **Approximate unlearning verification:** Some providers claim to use "machine unlearning" to remove specific data from models. Sentinel can test whether the unlearning actually reduced the model's knowledge of your data:

$$\Delta_{\text{unlearn}} = \text{MIA}(M_{\text{pre-unlearn}}, x_u) - \text{MIA}(M_{\text{post-unlearn}}, x_u)$$

If $\Delta_{\text{unlearn}} \approx 0$, the unlearning didn't work.

---

## XIV. The User Control Interface

### 14.1 Data Sovereignty Dashboard

Everything comes together in a single interface:

```
╔══════════════════════════════════════════════════════════════╗
║                 VIVIM DATA SOVEREIGNTY CENTER                ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  YOUR DATA UNIVERSE                                          ║
║  ──────────────────                                          ║
║  Total Conversations: 47,832 ACUs                            ║
║  Providers: OpenAI, Claude, Gemini, Cursor, Perplexity,     ║
║             Ollama                                           ║
║  Date Range: 2022-11-30 to 2026-03-15                       ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  DATA CLASSIFICATION                                  │  ║
║  │                                                       │  ║
║  │  ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ Private (never share)   │  ║
║  │  8,441 ACUs — 17.6%     [Configure rules]             │  ║
║  │                                                       │  ║
║  │  🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧 Selective (review each) │  ║
║  │  15,203 ACUs — 31.8%    [Review pending]              │  ║
║  │                                                       │  ║
║  │  🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 Available for sale            │  ║
║  │  24,188 ACUs — 50.6%    [Manage listings]             │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  AUTO-CLASSIFICATION RULES                            │  ║
║  │                                                       │  ║
║  │  ● Medical topics → Private (never share)        [✎]  │  ║
║  │  ● Legal advice → Private (never share)          [✎]  │  ║
║  │  ● Personal finance → Private (never share)      [✎]  │  ║
║  │  ● Company-specific code → Selective             [✎]  │  ║
║  │  ● Personal relationships → Private              [✎]  │  ║
║  │  ● General programming → Available               [✎]  │  ║
║  │  ● Creative writing → Selective                  [✎]  │  ║
║  │  ● Research/learning → Available                 [✎]  │  ║
║  │                                                       │  ║
║  │  [+ Add rule]  [Import rules from template]           │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  SENTINEL STATUS                                      │  ║
║  │                                                       │  ║
║  │  🛡️ Canaries: 142 deployed, 7 detected               │  ║
║  │  🛡️ Watermarks: Active on 31,209 ACUs                │  ║
║  │  🛡️ Privacy Monitor: Running (last scan 3 days ago)  │  ║
║  │  🛡️ Consent Monitor: All 12 consents compliant       │  ║
║  │                                                       │  ║
║  │  ⛔ ALERTS (2)                                        │  ║
║  │  • GPT-4o likely trained on your OpenAI data          │  ║
║  │    [View details] [Generate evidence] [File dispute]  │  ║
║  │  • Gemini 1.5 Pro possibly trained on Google data     │  ║
║  │    [View details] [Increase monitoring] [Wait]        │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │  ACTIONS                                              │  ║
║  │                                                       │  ║
║  │  [🔍 Run Full Sentinel Scan]     Cost: ~$47           │  ║
║  │  [📦 Generate Evidence Package]  For: GPT-4o alert    │  ║
║  │  [📊 View Exposure Report]       Last: 2026-03-12     │  ║
║  │  [🏪 Go to Marketplace]          12 active listings   │  ║
║  │  [⚙️  Manage Canaries]           Deploy / Check       │  ║
║  │  [📤 Export Everything]          Full sovereign backup │  ║
║  └────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════╝
```

---

## XV. Open Source Commitment

Every component of VIVIM Sentinel is open source under AGPL v3:

| Component | Repository | What It Does |
|---|---|---|
| `@vivim/sentinel-core` | Core detection library | MIA, canary, watermark algorithms |
| `@vivim/sentinel-canary` | Canary generation & management | Create, deploy, check canaries |
| `@vivim/sentinel-watermark` | Statistical watermarking | Embed and detect watermarks |
| `@vivim/sentinel-mia` | Membership inference engine | All MIA algorithms + meta-classifier |
| `@vivim/sentinel-extraction` | Extraction probing | Prefix completion + contextual extraction |
| `@vivim/sentinel-monitor` | Background monitoring service | Privacy monitor, consent checker |
| `@vivim/sentinel-evidence` | Evidence package generator | Legal-grade evidence bundles |
| `@vivim/sentinel-network` | Collective detection protocol | P2P aggregation, transparency index |
| `@vivim/sentinel-dashboard` | User interface | React-based sovereignty dashboard |
| `@vivim/sentinel-zk` | ZK circuits for detection proofs | Prove detection results without revealing data |

**Why open source?** Because the detection tools must be auditable by the same standard as the data itself. If VIVIM's detection methodology is proprietary, users have to trust us. If it's open source, they can verify. The tool that audits the auditors must itself be auditable.

---

## XVI. What This Changes

Today, the relationship between humans and AI companies is:

$$\text{Human} \xrightarrow{\text{gives data}} \text{AI Company} \xrightarrow{\text{gives nothing back}} \text{Human}$$

With VIVIM Sentinel:

$$\text{Human} \xrightarrow{\text{gives data (instrumented)}} \text{AI Company}$$

$$\text{Human} \xleftarrow{\text{knows exactly what was used}} \text{Sentinel}$$

$$\text{Human} \xrightarrow{\text{sells on own terms, or doesn't}} \text{Marketplace}$$

$$\text{Human} \xleftarrow{\text{evidence + remediation}} \text{Evidence Engine}$$

The asymmetry isn't just reduced. It's inverted. The user, for the first time, knows more about how their data was used than the company knows about the user's detection capabilities.

That is sovereignty.

---

*Document version: 1.0*
*Component: VIVIM Sentinel Toolkit — Detection & Protection Architecture*
*License: AGPL v3 (code), CC-BY-SA 4.0 (this specification)*
