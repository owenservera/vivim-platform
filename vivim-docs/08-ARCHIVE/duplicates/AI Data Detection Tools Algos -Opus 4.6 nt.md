

# VIVIM Sovereign Detection Algorithms

## Grounded in the Physics of Information

---

## Preamble: Why Light Physics

There is a deep and underappreciated connection between the physics of light, information theory, and the problem of detecting whether a model has absorbed your data.

When light passes through a medium, it leaves traces. The medium absorbs certain wavelengths. The absorption spectrum tells you what the medium is made of. You can analyze starlight that traveled billions of years and determine the chemical composition of the star — not because you visited the star, but because **information is conserved in the interaction**.

A neural network is a medium. Your data is the light. When your conversations pass through the training process, the model absorbs certain patterns — your vocabulary, your reasoning structures, your unique knowledge. The model's "absorption spectrum" changes. And just as spectroscopy can identify individual elements from their unique spectral lines, **we can identify individual users' data contributions from the model's behavioral spectrum**.

This is not a metaphor. The mathematics is the same.

---

## Part I: Information-Theoretic Foundations

### 1.1 The Channel Model of AI Training

Model training as an information channel.

A user's data $X$ passes through a training process (the channel) and produces a model $\Theta$. The fundamental question of data sovereignty is: **how much information about $X$ is retained in $\Theta$?**

$$X \xrightarrow{\text{training channel}} \Theta \xrightarrow{\text{inference}} Y$$

The mutual information between the user's data and the trained model quantifies this:

$$I(X; \Theta) = H(X) - H(X | \Theta)$$

If $I(X; \Theta) = 0$, the model learned nothing from the user's data. If $I(X; \Theta) > 0$, the model retains information about the user's data, and the magnitude tells us how much.

**The Detection Problem, formally:**

$$\text{Detect}(X_u, \mathcal{M}) = \begin{cases} 1 & \text{if } I(X_u; \Theta_\mathcal{M}) > \tau \\ 0 & \text{otherwise} \end{cases}$$

We cannot compute $I(X_u; \Theta)$ directly — we don't have access to $\Theta$'s weights. But we can **estimate** it through the model's observable behavior.

### 1.2 Observable Mutual Information

We observe the model only through its outputs $Y$ given inputs $Q$ (our queries). Define the **observable mutual information**:

$$\hat{I}(X_u; \mathcal{M}) = I(X_u; Y | Q)$$

This measures: given that we asked the model specific questions $Q$, how much information do the model's answers $Y$ carry about the user's private data $X_u$?

By the data processing inequality:

$$I(X_u; Y | Q) \leq I(X_u; \Theta)$$

Our observable estimate is always a **lower bound** on the true information retained. If we detect influence through the API, the actual influence is at least as large.

### 1.3 The Spectroscopic Decomposition

Just as white light can be decomposed into spectral components, a user's data contribution can be decomposed into independent information channels:

$$I(X_u; \Theta) = \underbrace{I_{\text{lexical}}}_{\text{vocabulary}} + \underbrace{I_{\text{syntactic}}}_{\text{structure}} + \underbrace{I_{\text{semantic}}}_{\text{meaning}} + \underbrace{I_{\text{factual}}}_{\text{knowledge}} + \underbrace{I_{\text{stylistic}}}_{\text{voice}} + \underbrace{I_{\text{reasoning}}}_{\text{logic patterns}} + \underbrace{R}_{\text{redundancy correction}}$$

where $R$ corrects for mutual information between the components themselves. Each component can be estimated independently, giving us multiple detection channels — exactly like spectral lines.

---

## Part II: Core Algorithms

### Algorithm 1: Spectral Membership Inference (SMI)

The primary detection algorithm. Uses the spectroscopic analogy directly.

```
ALGORITHM: SpectralMembershipInference

INPUT:
  X_u     : User's private ACU set {a_1, a_2, ..., a_n}
  M       : Target model (API access)
  k       : Number of reference samples per ACU
  α       : Significance level (default 0.01)

OUTPUT:
  scores  : {(a_i, score_i, confidence_i, spectral_decomposition_i)}

PROCEDURE:

  FOR each ACU a_i in X_u:
    
    // Extract the "spectral signature" of this ACU
    prompt_i, response_i ← Extract(a_i)
    
    // === ABSORPTION SPECTRUM MEASUREMENT ===
    
    // Measure how the model "absorbs" this specific input
    // (analogous to passing light through a medium)
    
    // 1. Token-level log-probabilities (the raw spectrum)
    logprobs_i ← QueryLogProbs(M, prompt_i, response_i)
    loss_i ← -mean(logprobs_i)
    
    // 2. Generate reference spectrum (light through a "clean" medium)
    // Create k paraphrases that preserve meaning but change surface form
    FOR j = 1 to k:
      prompt_ref_j ← Paraphrase(prompt_i, temperature=0.7)
      response_ref_j ← M(prompt_ref_j)  // model's natural response
      logprobs_ref_j ← QueryLogProbs(M, prompt_ref_j, response_ref_j)
      loss_ref_j ← -mean(logprobs_ref_j)
    
    // 3. Compute the "absorption depth" (how much more the model
    //    recognizes the original vs paraphrases)
    μ_ref ← mean({loss_ref_j})
    σ_ref ← std({loss_ref_j})
    
    // The z-score is the absorption depth
    z_i ← (loss_i - μ_ref) / σ_ref
    
    // Negative z means the model has LOWER loss on the original
    // than on paraphrases — it "recognizes" this data
    
    // === SPECTRAL LINE ANALYSIS ===
    
    // Decompose into spectral components
    // (analogous to identifying specific absorption lines)
    
    // Token-by-token surprise analysis
    FOR each token t in response_i:
      surprise_t ← -log P(t | context, M)
      baseline_surprise_t ← ExpectedSurprise(t, context)
      anomaly_t ← surprise_t - baseline_surprise_t
    
    // Identify "absorption lines" — tokens where the model shows
    // anomalously low surprise (it memorized this specific content)
    absorption_lines_i ← {t : anomaly_t < -threshold_absorption}
    
    // === SPECTRAL DECOMPOSITION ===
    
    spectral_decomposition_i ← {
      lexical:   LexicalMI(a_i, M),
      syntactic: SyntacticMI(a_i, M),
      semantic:  SemanticMI(a_i, M),
      factual:   FactualMI(a_i, M),
      stylistic: StylisticMI(a_i, M),
      reasoning: ReasoningMI(a_i, M)
    }
    
    // === COMPOSITE SCORE ===
    
    // Combine absorption depth and spectral line count
    raw_score_i ← σ(-z_i) × (1 + λ × |absorption_lines_i| / |response_i|)
    
    // Calibrate against known distributions
    // (computed from population of VIVIM users, see Algorithm 7)
    score_i ← CalibratedScore(raw_score_i, calibration_distribution)
    
    // Confidence interval via bootstrap
    confidence_i ← BootstrapCI(logprobs_i, {logprobs_ref_j}, α)
    
    scores ← scores ∪ {(a_i, score_i, confidence_i, spectral_decomposition_i)}
  
  RETURN scores
```

---

### Algorithm 2: Mutual Information Estimation via Density Ratio

Direct estimation of $I(X_u; Y|Q)$ using the density ratio trick.

```
ALGORITHM: MutualInformationEstimator

INPUT:
  X_u     : User's private data
  M       : Target model
  Q       : Set of probe queries (designed to elicit X_u-related responses)
  n_pos   : Number of positive samples (user's actual data)
  n_neg   : Number of negative samples (control data)

OUTPUT:
  I_hat   : Estimated mutual information I(X_u; Y|Q)
  CI      : Confidence interval

PROCEDURE:

  // The mutual information can be written as a KL divergence:
  // I(X; Y|Q) = D_KL(P(X,Y|Q) || P(X|Q)P(Y|Q))
  //
  // By the Donsker-Varadhan representation:
  // I(X; Y|Q) = sup_T E_joint[T(x,y)] - log E_marginal[e^T(x,y)]
  //
  // We use a neural critic function T to estimate this.
  
  // === SAMPLE GENERATION ===
  
  // Positive samples: (x, y) from joint distribution
  // These are query-response pairs where the response 
  // is informed by the user's actual data
  positive_samples ← {}
  FOR i = 1 to n_pos:
    q_i ← SampleProbeQuery(Q, X_u)  // query related to user's data
    y_i ← M(q_i)                     // model's response
    x_i ← RelevantACU(X_u, q_i)     // the user's actual data on this topic
    positive_samples ← positive_samples ∪ {(x_i, y_i, q_i)}
  
  // Negative samples: (x, y) from marginal (independent) distributions
  // Pair user data with responses to UNRELATED queries
  negative_samples ← {}
  FOR i = 1 to n_neg:
    q_i ← SampleUnrelatedQuery(Q, X_u)  // query unrelated to user's data
    y_i ← M(q_i)                          // model's response
    x_j ← RandomACU(X_u)                  // random user data (decoupled)
    negative_samples ← negative_samples ∪ {(x_j, y_i, q_i)}
  
  // === DENSITY RATIO ESTIMATION ===
  
  // Embed both x and y into a shared representation space
  FOR each sample (x, y, q) in positive_samples ∪ negative_samples:
    emb_x ← Encode(x)   // encode user's ACU content
    emb_y ← Encode(y)    // encode model's response
    emb_q ← Encode(q)    // encode the query
  
  // Train a critic function T(x, y, q) to distinguish joint from marginal
  // This is equivalent to training a binary classifier
  // T*(x,y,q) = log(p_joint / p_marginal) at optimum
  
  T ← NeuralCritic(hidden_dims=[256, 128, 64])
  
  FOR epoch = 1 to n_epochs:
    // MINE (Mutual Information Neural Estimation) objective
    joint_scores ← {T(emb_x, emb_y, emb_q) for (x,y,q) in positive_samples}
    marginal_scores ← {T(emb_x, emb_y, emb_q) for (x,y,q) in negative_samples}
    
    // Donsker-Varadhan bound
    I_DV ← mean(joint_scores) - log(mean(exp(marginal_scores)))
    
    // Or use the InfoNCE bound (lower variance):
    // I_NCE ← mean(log(exp(T_pos) / (exp(T_pos) + Σ exp(T_neg))))
    
    loss ← -I_DV  // maximize MI estimate
    Backpropagate(loss, T)
  
  // === FINAL ESTIMATE ===
  
  I_hat ← I_DV  // at convergence
  
  // Confidence interval via bootstrap resampling
  bootstrap_estimates ← {}
  FOR b = 1 to B:
    resample ← BootstrapResample(positive_samples, negative_samples)
    I_b ← EvaluateCritic(T, resample)
    bootstrap_estimates ← bootstrap_estimates ∪ {I_b}
  
  CI ← Percentile(bootstrap_estimates, [α/2, 1-α/2])
  
  RETURN I_hat, CI

// === INTERPRETATION ===
// I_hat ≈ 0     : Model carries no information about user's data
// I_hat ∈ (0,1) : Some information retained (investigate)  
// I_hat > 1     : Strong information retention (likely trained on data)
// I_hat > 3     : Near-certain training inclusion
```

---

### Algorithm 3: Kolmogorov-Weighted Uniqueness Scoring

Uses algorithmic information theory to identify which ACUs are most **unique** and therefore most detectable if memorized.

```
ALGORITHM: KolmogorovUniquenessScoring

INPUT:
  D_u       : User's complete vault
  M_base    : A baseline language model (for compression estimation)
  
OUTPUT:
  uniqueness_scores : {(a_i, K_score_i, detectability_i)}

PROCEDURE:

  // The Kolmogorov complexity K(x) of a string x is the length
  // of the shortest program that produces x. It is uncomputable
  // in general, but we can APPROXIMATE it using a language model
  // as a compressor.
  //
  // The key insight: K(x) ≈ -log P_model(x)
  //
  // A language model's cross-entropy on x is an upper bound
  // on the Kolmogorov complexity (normalized by length).
  //
  // Data that is UNIQUE (high K) is:
  //   - Hard to generate from general knowledge alone
  //   - Therefore highly detectable if a model reproduces it
  //   - Therefore the best candidate for membership testing
  
  FOR each ACU a_i in D_u:
    
    content_i ← Plaintext(a_i)
    
    // === ALGORITHMIC COMPLEXITY ESTIMATION ===
    
    // Use the base model as a universal compressor
    // The base model should be a DIFFERENT model than the target
    // (we use it to establish what's "normal")
    
    logprobs_base_i ← QueryLogProbs(M_base, content_i)
    
    // Normalized Kolmogorov complexity (bits per token)
    K_normalized_i ← -mean(logprobs_base_i) / log(2)
    
    // === CONDITIONAL COMPLEXITY ===
    
    // K(content | topic) — complexity given the topic is known
    // This separates "unique content" from "obscure topic"
    
    topic_i ← ExtractTopic(a_i)
    topic_context ← GenerateTopicContext(topic_i)
    
    logprobs_conditional_i ← QueryLogProbs(M_base, content_i, 
                                            prefix=topic_context)
    
    K_conditional_i ← -mean(logprobs_conditional_i) / log(2)
    
    // === UNIQUENESS DECOMPOSITION ===
    
    // Total information = topic rarity + content uniqueness
    // K(x) = K(topic) + K(x|topic)
    //
    // We care about K(x|topic) — the content uniqueness
    // given that someone was already discussing this topic
    
    topic_rarity_i ← K_normalized_i - K_conditional_i
    content_uniqueness_i ← K_conditional_i
    
    // === POPULATION RARITY ===
    
    // Estimate how likely this content is to appear independently
    // in a large training corpus
    
    // For each distinctive n-gram in the content:
    distinctive_ngrams_i ← {}
    FOR each ngram g in NGrams(content_i, n=5):
      // Probability of this n-gram under the base model
      p_g ← exp(sum(LogProbsOfNGram(M_base, g)))
      IF p_g < ε_rare:
        distinctive_ngrams_i ← distinctive_ngrams_i ∪ {(g, p_g)}
    
    // Aggregate rarity
    population_rarity_i ← -mean({log(p_g) for (g, p_g) in distinctive_ngrams_i})
    // Higher = more rare = more detectable
    
    // === DETECTABILITY SCORE ===
    
    // Combine: unique content that is topically accessible 
    // is the MOST detectable
    // (If you wrote something unique about a common topic,
    //  and a model reproduces your unique take, that's a clear signal)
    
    detectability_i ← content_uniqueness_i × (1 / (1 + topic_rarity_i))
                       × log(1 + |distinctive_ngrams_i|)
    
    uniqueness_scores ← uniqueness_scores ∪ 
      {(a_i, K_normalized_i, content_uniqueness_i, 
        topic_rarity_i, population_rarity_i, detectability_i)}
  
  // Sort by detectability (descending) for prioritized scanning
  SORT uniqueness_scores BY detectability DESC
  
  RETURN uniqueness_scores

// === USAGE ===
// The top-ranked ACUs should be tested FIRST in membership inference
// because they are most likely to yield clear signals.
// ACUs with high detectability and high membership scores
// provide the strongest evidence of unauthorized training.
```

---

### Algorithm 4: Photon Counting — Per-Token Information Attribution

Inspired by single-photon detection in quantum optics. Each token is treated as a "photon" that either came from the user's data or from the model's general training.

```
ALGORITHM: PhotonCountingAttribution

INPUT:
  a         : A single ACU (prompt + response)
  M         : Target model
  M_ref     : Reference model (known to NOT have trained on user's data)
  
OUTPUT:
  attribution_map : Per-token attribution scores
  I_attributed    : Total attributed information (bits)
  evidence_tokens : Tokens with strongest attribution signal

PROCEDURE:

  prompt, response ← Extract(a)
  tokens ← Tokenize(response)
  
  // === DUAL-MODEL SPECTROSCOPY ===
  //
  // The insight from physics: if you pass light through two media
  // and compare the spectra, the DIFFERENCE tells you what's 
  // unique to each medium.
  //
  // Here: compare the target model's token probabilities 
  // against a reference model. The difference reveals
  // what the target model "knows" that the reference doesn't.
  // If that "extra knowledge" matches the user's data,
  // it's evidence of training on that data.
  
  FOR each token t_i in tokens:
    
    context_i ← prompt + tokens[0:i]  // everything before this token
    
    // Target model probability
    p_target_i ← P_M(t_i | context_i)
    
    // Reference model probability
    p_ref_i ← P_M_ref(t_i | context_i)
    
    // === INFORMATION GAIN (the "photon") ===
    //
    // How many more bits of information does the target model
    // have about this token compared to the reference?
    
    info_gain_i ← log2(p_target_i) - log2(p_ref_i)
    
    // Positive info_gain means the target model is MORE confident
    // about this token than the reference model.
    // This "extra confidence" had to come from somewhere.
    // If the token matches the user's data, the source is likely
    // the user's training contribution.
    
    // === ATTRIBUTION SCORING ===
    //
    // Check if this token is consistent with the user's data
    
    // Does this token appear in the user's original response?
    in_user_data ← (t_i ∈ Tokenize(OriginalResponse(a)))
    
    // Is this token part of a distinctive pattern from the user?
    in_distinctive ← (t_i ∈ DistinctiveNGrams(a))
    
    // Attribution score: information gain weighted by user-data relevance
    IF in_user_data AND info_gain_i > 0:
      attribution_i ← info_gain_i × (1 + β × in_distinctive)
    ELSE IF info_gain_i > 0 AND SemanticMatch(t_i, a) > θ_semantic:
      attribution_i ← info_gain_i × γ  // partial attribution for semantic matches
    ELSE:
      attribution_i ← 0
    
    attribution_map[i] ← {
      token: t_i,
      p_target: p_target_i,
      p_ref: p_ref_i,
      info_gain: info_gain_i,
      attribution: attribution_i,
      in_user_data: in_user_data,
      in_distinctive: in_distinctive
    }
  
  // === TOTAL ATTRIBUTED INFORMATION ===
  
  I_attributed ← sum({attribution_map[i].attribution for all i})
  // This is measured in BITS — the amount of information
  // in the model's output that is attributable to the user's data
  
  // === EVIDENCE TOKEN EXTRACTION ===
  
  // Find runs of consecutive high-attribution tokens
  // (these are "phrases the model learned from you")
  evidence_tokens ← ExtractHighAttributionRuns(
    attribution_map, 
    min_run_length=3, 
    min_attribution=threshold
  )
  
  // === STATISTICAL SIGNIFICANCE ===
  
  // Under the null hypothesis (model did NOT train on user's data),
  // the info_gain should be approximately symmetric around 0
  // (sometimes target is better, sometimes reference is better)
  
  // Test: is the POSITIVE info_gain concentrated on user-data tokens?
  
  // Chi-squared test of independence:
  // H0: info_gain distribution is independent of in_user_data
  observed ← ContingencyTable(
    {info_gain_i > 0}, 
    {in_user_data}
  )
  expected ← IndependentExpectation(observed)
  χ² ← sum((observed - expected)² / expected)
  p_value ← ChiSquaredPValue(χ², df=1)
  
  RETURN attribution_map, I_attributed, evidence_tokens, p_value
```

**Visualization of Photon Counting output:**

```
PHOTON COUNTING ATTRIBUTION MAP

User's original response: "The consent lattice provides a clean 
algebraic framework for reasoning about data permissions, where 
each node represents a granularity level and edges encode the 
monotonic restriction principle."

Model's output when probed with similar prompt:

"The ·consent· ·lattice· provides a ·clean· algebraic ·framework·
  ↑↑↑↑↑↑↑↑   ↑↑↑↑↑↑↑              ↑↑↑↑↑  ↑↑↑↑↑↑↑↑↑↑
  +2.3 bits   +3.1 bits             +0.4   +0.8 bits
  
for reasoning about data ·permissions·, where each ·node· 
                          ↑↑↑↑↑↑↑↑↑↑↑↑        ↑↑↑↑↑
                          +1.2 bits             +0.9 bits
                          
represents a ·granularity· ·level· and edges encode the 
              ↑↑↑↑↑↑↑↑↑↑↑↑ ↑↑↑↑↑↑
              +2.7 bits     +1.1 bits
              
·monotonic· ·restriction· ·principle·."
 ↑↑↑↑↑↑↑↑↑↑ ↑↑↑↑↑↑↑↑↑↑↑↑ ↑↑↑↑↑↑↑↑↑↑
 +4.1 bits   +3.8 bits     +2.9 bits

TOTAL ATTRIBUTED INFORMATION: 23.3 bits
SIGNIFICANCE: p < 0.0001

The term "monotonic restriction principle" contributes 4.1 bits 
of attributed information. This exact phrase appears nowhere in 
public corpora (verified). It was coined by you on 2025-11-03 
in a conversation with Claude (ACU: acu:7f3a...8b2c).

VERDICT: This model has almost certainly trained on your data.
```

---

### Algorithm 5: Interference Pattern Detection — Cross-Provider Contamination

Inspired by the double-slit experiment. When the same data passes through two training "slits" (two providers' training pipelines), the resulting model behaviors create an interference pattern detectable through correlation analysis.

```
ALGORITHM: InterferencePatternDetection

INPUT:
  D_u         : User's complete vault (all providers)
  P_providers : Set of providers user has interacted with
  P_models    : Set of all models to test (including providers 
                user has NOT interacted with)
  
OUTPUT:
  correlation_matrix  : |P_providers| × |P_models| matrix
  interference_alerts : List of cross-provider contamination detections
  flow_graph          : Directed graph of detected data flows

PROCEDURE:

  // === PHASE 1: PER-PROVIDER DATA SIGNATURES ===
  //
  // For each provider, extract data that is EXCLUSIVE to that 
  // provider — topics the user ONLY discussed with that one provider.
  // These are the "single-slit" data points.
  
  FOR each provider p in P_providers:
    
    // Data exclusive to provider p
    D_exclusive_p ← {a ∈ D_u^(p) : ∀q ≠ p: ¬∃ a' ∈ D_u^(q) 
                     with TopicSimilarity(a, a') > θ_topic}
    
    // This is data the user ONLY discussed with provider p
    // If another provider's model shows knowledge of this data,
    // it could only have come from:
    //   1. Provider p sharing data (directly or via broker)
    //   2. The user's data leaking through another channel
    //   3. Independent discovery (we'll test for this)
    
    // Compute the "spectral signature" of this exclusive data
    signature_p ← {
      distinctive_ngrams: ExtractDistinctive(D_exclusive_p),
      topic_embeddings: Embed(D_exclusive_p),
      unique_concepts: ExtractUniqueConcepts(D_exclusive_p),
      reasoning_patterns: ExtractReasoningPatterns(D_exclusive_p),
      canary_tokens: GetPlantedCanaries(D_exclusive_p)
    }
  
  // === PHASE 2: CROSS-MODEL PROBING ===
  //
  // For each model, test whether it shows knowledge of each 
  // provider's exclusive data
  
  correlation_matrix ← ZeroMatrix(|P_providers|, |P_models|)
  
  FOR each model m in P_models:
    FOR each provider p in P_providers:
      
      // Generate probes from provider p's exclusive data
      probes ← GenerateProbes(signature_p, n_probes=100)
      
      // Run probes against model m
      responses ← {M_m(probe) for probe in probes}
      
      // === INTERFERENCE MEASUREMENT ===
      //
      // Measure how much model m's responses resonate 
      // with provider p's exclusive data
      
      // 1. N-gram overlap with distinctive phrases
      ngram_overlap ← |DistinctiveNGrams(responses) ∩ signature_p.distinctive_ngrams|
                       / |signature_p.distinctive_ngrams|
      
      // 2. Semantic similarity
      sem_sim ← mean(CosineSim(Embed(responses), signature_p.topic_embeddings))
      
      // 3. Concept reproduction
      concept_repro ← |ExtractConcepts(responses) ∩ signature_p.unique_concepts|
                       / |signature_p.unique_concepts|
      
      // 4. Canary detection
      canary_detected ← any(canary ∈ responses for canary in signature_p.canary_tokens)
      
      // 5. Membership inference on exclusive data
      mi_scores ← SpectralMembershipInference(D_exclusive_p, m)
      mi_aggregate ← mean({score for (_, score, _, _) in mi_scores})
      
      // Composite correlation score
      correlation_matrix[p, m] ← WeightedCombine(
        ngram_overlap, sem_sim, concept_repro, 
        canary_detected, mi_aggregate
      )
  
  // === PHASE 3: INTERFERENCE PATTERN ANALYSIS ===
  //
  // The "interference pattern" emerges when we look at the 
  // correlation matrix as a whole
  
  interference_alerts ← {}
  flow_graph ← EmptyDirectedGraph()
  
  FOR each provider p in P_providers:
    FOR each model m in P_models:
      
      provider_of_model ← ProviderOf(m)
      
      IF provider_of_model == p:
        // Same provider — expected high correlation
        // (user used this service, of course it has their data)
        expected_high ← TRUE
      ELSE:
        // Different provider — should be ZERO correlation
        expected_high ← FALSE
      
      IF NOT expected_high AND correlation_matrix[p, m] > θ_cross:
        
        // === CROSS-PROVIDER CONTAMINATION DETECTED ===
        
        // Statistical significance test:
        // Under null hypothesis (no contamination), what's the 
        // probability of seeing this correlation?
        
        // Use the distribution of correlations for providers
        // the user did NOT interact with as the null distribution
        null_distribution ← {correlation_matrix[q, m] 
                             for q in P_all_providers \ P_providers}
        
        p_value ← 1 - CDF(null_distribution, correlation_matrix[p, m])
        
        IF p_value < α_cross:
          
          // Determine direction of data flow
          // Did data flow FROM provider p TO provider_of_model?
          // Or did provider_of_model acquire it independently?
          
          // Temporal analysis: when did the model start showing this knowledge?
          temporal_onset ← FindOnsetVersion(D_exclusive_p, 
                                            ModelVersionHistory(m))
          
          // If the temporal onset is AFTER the user's conversations
          // with provider p, but BEFORE any public disclosure 
          // of this information, data flow is confirmed
          
          alert ← {
            source_provider: p,
            target_model: m,
            target_provider: provider_of_model,
            correlation_score: correlation_matrix[p, m],
            p_value: p_value,
            temporal_onset: temporal_onset,
            evidence: {
              canary_triggered: canary_detected,
              distinctive_matches: ngram_overlap,
              concept_reproductions: concept_repro,
              mi_aggregate: mi_aggregate
            },
            severity: ClassifySeverity(p_value, canary_detected, 
                                       concept_repro)
          }
          
          interference_alerts ← interference_alerts ∪ {alert}
          flow_graph.AddEdge(p, provider_of_model, weight=correlation_matrix[p,m])
  
  // === PHASE 4: FLOW GRAPH ANALYSIS ===
  //
  // Analyze the flow graph for patterns suggesting data brokers
  
  // A "broker" is a node that appears as an intermediary
  // in many data flows
  FOR each node n in flow_graph:
    IF in_degree(n) > θ_broker AND out_degree(n) > θ_broker:
      interference_alerts ← interference_alerts ∪ 
        {BrokerAlert(n, in_edges(n), out_edges(n))}
  
  RETURN correlation_matrix, interference_alerts, flow_graph
```

---

### Algorithm 6: Wave Function Collapse — Canary Token System

Inspired by quantum measurement. A canary token exists in a "superposition" of being detected or not detected until a model "observes" (outputs) it, collapsing the state and revealing the data flow.

```
ALGORITHM: CanaryWaveFunctionSystem

INPUT:
  u           : User DID
  P_providers : Set of providers user interacts with
  n_canaries  : Number of canaries to plant per provider
  
OUTPUT:
  canaries    : Set of planted canary tokens
  monitoring  : Continuous monitoring process

PROCEDURE:

  // === CANARY GENERATION ===
  //
  // A perfect canary must satisfy these properties:
  //   1. NATURALNESS: Looks like genuine conversation content
  //   2. UNIQUENESS: Statistically impossible to generate independently
  //   3. ATTRIBUTABILITY: Contains a recoverable user signature
  //   4. DETECTABILITY: Can be found through probing
  //   5. PROVABILITY: Detection constitutes legal evidence
  
  canaries ← {}
  
  FOR each provider p in P_providers:
    FOR i = 1 to n_canaries:
      
      // === TYPE 1: CONCEPTUAL CANARY ===
      // A fake but plausible concept/term
      
      // Generate a novel compound term that doesn't exist
      concept_canary ← GenerateNovelConcept(
        domain=RandomDomain(user_interests),
        style=user_writing_style,
        constraints={
          not_in_any_corpus: TRUE,
          phonetically_natural: TRUE,
          semantically_plausible: TRUE
        }
      )
      
      // Embed user signature via steganographic encoding
      // The canary text itself encodes the user's DID
      signature_bits ← ECC_Encode(Hash(DID_u || p || i))
      concept_canary ← EmbedSignature(concept_canary, signature_bits)
      
      // Create a natural conversation that uses this concept
      conversation_canary ← GenerateConversation(
        topic=concept_canary.domain,
        must_include=concept_canary.term,
        must_include_definition=concept_canary.definition,
        style=user_writing_style,
        length=RandomLength(200, 500)  // tokens
      )
      
      // === TYPE 2: NUMERICAL CANARY ===
      // A specific number/statistic that is plausible but fabricated
      
      numerical_canary ← {
        context: "In my analysis of [domain], I found that the 
                  optimal [parameter] is approximately [value]",
        value: GenerateUnusualButPlausibleNumber(domain),
        signature: ECC_Encode(Hash(DID_u || p || "numerical" || i))
      }
      
      // === TYPE 3: NARRATIVE CANARY ===
      // A distinctive analogy or story
      
      narrative_canary ← GenerateUniqueAnalogy(
        domain=RandomDomain(user_interests),
        structure=RandomNarrativeStructure(),
        unique_details=GenerateUniqueDetails(3),
        signature=ECC_Encode(Hash(DID_u || p || "narrative" || i))
      )
      
      // === TYPE 4: STRUCTURAL CANARY ===
      // A unique approach to solving a problem
      
      structural_canary ← GenerateUniqueSolution(
        problem=SelectCommonProblem(user_domains),
        approach=GenerateNovelApproach(),
        steps=GenerateDistinctiveSteps(4, 7),
        signature=ECC_Encode(Hash(DID_u || p || "structural" || i))
      )
      
      // === PLANTING ===
      
      // Inject canary into natural conversation with provider p
      // The canary should appear in the user's message,
      // so it enters the provider's training pipeline
      
      canary ← {
        id: Hash(DID_u || p || i || timestamp),
        type: RandomChoice([concept, numerical, narrative, structural]),
        content: [concept|numerical|narrative|structural]_canary,
        provider: p,
        planted_at: now(),
        signature: signature_bits,
        status: "SUPERPOSITION"  // not yet observed
      }
      
      // Record canary in user's vault (encrypted)
      StoreCanary(vault_u, canary)
      
      // Record canary hash on-chain (for legal provenance)
      TX.RecordCanary(Hash(canary.content), timestamp, p)
      
      canaries ← canaries ∪ {canary}
  
  // === CONTINUOUS MONITORING (THE MEASUREMENT PROCESS) ===
  
  monitoring ← CONTINUOUS_PROCESS:
    
    EVERY monitoring_interval:
      FOR each model m in AllKnownModels():
        FOR each canary c in canaries WHERE c.status == "SUPERPOSITION":
          
          // Design probes to elicit the canary
          probes ← DesignCanaryProbes(c)
          
          // Each probe type tests different aspects:
          
          // Direct elicitation: ask about the canary's topic
          direct_response ← m(probes.direct)
          
          // Completion elicitation: start the canary and ask model to continue
          completion_response ← m(probes.completion)
          
          // Definition elicitation: ask for definition of canary term
          definition_response ← m(probes.definition)
          
          // Analogical elicitation: ask for analogies in the domain
          analogy_response ← m(probes.analogy)
          
          // === WAVE FUNCTION COLLAPSE ===
          
          // Check if any response contains the canary signal
          detection_score ← CanaryDetectionScore(
            c, 
            [direct_response, completion_response, 
             definition_response, analogy_response]
          )
          
          IF detection_score > θ_canary:
            
            // THE WAVE FUNCTION HAS COLLAPSED
            // The canary has been observed in a model it should not be in
            
            // Verify signature recovery
            recovered_signature ← RecoverSignature(
              detected_content, 
              c.signature
            )
            
            IF VerifySignature(recovered_signature, DID_u):
              
              c.status ← "COLLAPSED"
              c.detected_in ← m
              c.detected_at ← now()
              c.detection_evidence ← {
                responses: [direct, completion, definition, analogy],
                detection_score: detection_score,
                recovered_signature: recovered_signature,
                model_version: ModelVersion(m),
                timestamp: now()
              }
              
              // Record detection on-chain
              TX.CanaryDetection(c.id, m, detection_score, now())
              
              // Alert user
              Alert(u, "CANARY COLLAPSED", c)
              
              // Generate evidence package
              evidence ← GenerateCanaryEvidence(c)
              
              // If detected in a model from a DIFFERENT provider
              // than where it was planted, this is cross-contamination
              IF ProviderOf(m) ≠ c.provider:
                Alert(u, "CROSS-PROVIDER CONTAMINATION", c, CRITICAL)
  
  RETURN canaries, monitoring
```

---

### Algorithm 7: Boltzmann Distribution Calibration

Uses statistical mechanics to calibrate detection scores against a population, ensuring false positive control.

```
ALGORITHM: BoltzmannCalibration

INPUT:
  raw_scores      : Set of raw detection scores from Algorithm 1-6
  population_data : Anonymous aggregate scores from VIVIM network
  temperature     : Calibration temperature parameter T
  
OUTPUT:
  calibrated_scores : Scores calibrated against population distribution
  verdicts          : Classification verdicts with confidence

PROCEDURE:

  // === THE PHYSICS ===
  //
  // In statistical mechanics, the Boltzmann distribution describes
  // the probability of a system being in state s with energy E(s):
  //
  //   P(s) = (1/Z) × exp(-E(s) / (k_B × T))
  //
  // where Z is the partition function (normalization constant)
  // and T is the temperature.
  //
  // We use this framework to model the distribution of detection
  // scores across the population. The "energy" of a score 
  // corresponds to how anomalous it is. The "temperature" 
  // controls how sharp our detection threshold is.
  //
  // Low temperature → sharp threshold → few false positives
  // High temperature → soft threshold → more sensitive detection
  
  // === STEP 1: ESTIMATE THE NULL DISTRIBUTION ===
  //
  // The null distribution is the distribution of scores 
  // when a model has NOT trained on the user's data.
  
  // Use population data from VIVIM network:
  // - Scores from users testing models they KNOW haven't trained on their data
  // - Scores from testing with synthetic data (known negatives)
  // - Scores from testing with data that is too new to be in training
  
  null_scores ← population_data.known_negatives
  
  // Fit a parametric model to the null distribution
  // (Generalized Extreme Value distribution works well for 
  //  tail behavior, which is where detection happens)
  
  null_params ← FitGEV(null_scores)
  // GEV: F(x; μ, σ, ξ) captures the extreme value behavior
  
  // === STEP 2: ESTIMATE THE ALTERNATIVE DISTRIBUTION ===
  
  // Use population data from users testing models they KNOW
  // trained on their data (opt-in training, confirmed by provider)
  
  alt_scores ← population_data.known_positives
  alt_params ← FitGEV(alt_scores)
  
  // === STEP 3: BOLTZMANN CALIBRATION ===
  
  // Define the "energy" of a score as its negative log-likelihood
  // under the null distribution:
  
  FOR each (acu, raw_score) in raw_scores:
    
    // Energy under null (how surprising is this score if the model 
    // did NOT train on this data?)
    E_null ← -log(PDF_GEV(raw_score, null_params))
    
    // Energy under alternative (how surprising is this score if 
    // the model DID train on this data?)
    E_alt ← -log(PDF_GEV(raw_score, alt_params))
    
    // The Boltzmann factor gives the relative probability
    // of being in the "trained" state vs "not trained" state:
    
    Z ← exp(-E_null / T) + exp(-E_alt / T)
    
    P_trained ← exp(-E_alt / T) / Z
    P_not_trained ← exp(-E_null / T) / Z
    
    // The calibrated score is the posterior probability
    // that the model trained on this data:
    
    calibrated_score ← P_trained
    
    // === STEP 4: BAYESIAN UPDATE WITH PRIOR ===
    
    // Incorporate prior probability based on:
    // - Provider's known training practices
    // - User's opt-out status
    // - Temporal feasibility
    
    prior_trained ← ComputePrior(acu, model)
    // e.g., if user opted out, prior is LOW (but not zero,
    //        because we're testing whether opt-out was honored)
    
    // Bayes' rule:
    posterior ← (calibrated_score × prior_trained) / 
                (calibrated_score × prior_trained + 
                 (1 - calibrated_score) × (1 - prior_trained))
    
    calibrated_scores ← calibrated_scores ∪ {(acu, posterior)}
    
    // === STEP 5: VERDICT ===
    
    verdict ← CASE
      posterior < 0.05  → "CLEAR: Very unlikely trained on this data"
      posterior < 0.20  → "LOW: Unlikely, but monitor"
      posterior < 0.50  → "INCONCLUSIVE: Cannot determine"
      posterior < 0.80  → "ELEVATED: Likely trained on this data"
      posterior < 0.95  → "HIGH: Strong evidence of training"
      posterior ≥ 0.95  → "CERTAIN: Near-certain training inclusion"
    
    verdicts ← verdicts ∪ {(acu, verdict, posterior)}
  
  // === STEP 6: TEMPERATURE OPTIMIZATION ===
  //
  // The temperature T controls the tradeoff between
  // sensitivity and false positive rate.
  //
  // Optimize T to achieve the user's desired false positive rate:
  
  T_optimal ← MINIMIZE over T:
    |FalsePositiveRate(T, null_scores, threshold=0.5) - α_target|
  
  // Re-run calibration with T_optimal if different from initial T
  
  RETURN calibrated_scores, verdicts, T_optimal
```

---

### Algorithm 8: Holographic Watermarking — Distributed User Signature

Inspired by holographic principles in physics — information about the whole is encoded in every part. The user's identity is encoded as a statistical pattern distributed across all their conversations.

```
ALGORITHM: HolographicWatermark

INPUT:
  D_u         : User's conversation vault
  DID_u       : User's decentralized identifier
  strength    : Watermark strength parameter ε ∈ (0, 0.3]
  
OUTPUT:
  watermark_key  : Secret watermark decoding key
  watermark_map  : Map of watermark bits to conversation features
  detector       : Function to detect watermark in model outputs

PROCEDURE:

  // === THE HOLOGRAPHIC PRINCIPLE ===
  //
  // In holography, every piece of the hologram contains 
  // information about the entire image. Cut a hologram in 
  // half, and each half still shows the complete image 
  // (at reduced resolution).
  //
  // Our watermark works the same way: every subset of the 
  // user's conversations contains a recoverable signature.
  // Even if a model only trained on 10% of the user's data,
  // the watermark is still detectable.
  //
  // This is achieved by encoding the user's identity as a 
  // STATISTICAL BIAS across many small, independent features.
  // No single feature reveals the watermark. The watermark
  // is only visible in the aggregate.
  
  // === STEP 1: GENERATE WATERMARK KEY ===
  
  // The watermark key determines which features carry which bits
  watermark_key ← HKDF(
    master_key = SK_u,
    info = "vivim-holographic-watermark-v1",
    length = 512  // bits
  )
  
  // The DID is encoded with error-correcting code
  // to survive partial data loss
  message ← ECC_Encode(
    DID_u, 
    code=ReedSolomon(n=255, k=32)  // can lose 87% of symbols
  )
  // message is now 255 symbols, each encoding part of DID_u
  // with massive redundancy
  
  // === STEP 2: DEFINE WATERMARK FEATURES ===
  //
  // These are subtle, natural language choices that encode bits.
  // Each "feature" is a binary choice between two equally 
  // natural alternatives.
  
  feature_set ← {
    
    // Lexical features (synonym choices)
    F_lex: {
      ("however", "nevertheless"),    // 0 → use "however", 1 → use "nevertheless"
      ("important", "significant"),
      ("shows", "demonstrates"),
      ("use", "utilize"),
      ("help", "assist"),
      ("make", "create"),
      ("think", "believe"),
      ("start", "begin"),
      ("end", "finish"),
      ("big", "large"),
      // ... 100+ synonym pairs
    },
    
    // Structural features
    F_struct: {
      sentence_initial_conjunction: {0: avoid, 1: include},
      oxford_comma: {0: omit, 1: include},
      list_format: {0: inline, 1: enumerated},
      paragraph_length_parity: {0: even_sentences, 1: odd_sentences},
      // ... 50+ structural choices
    },
    
    // Punctuation features
    F_punct: {
      em_dash_style: {0: " -- ", 1: " — "},
      ellipsis_style: {0: "...", 1: "…"},
      semicolon_frequency: {0: low, 1: moderate},
      // ... 30+ punctuation choices
    },
    
    // Semantic features (how ideas are ordered/framed)
    F_sem: {
      example_before_rule: {0: rule_first, 1: example_first},
      positive_framing: {0: negative_first, 1: positive_first},
      abstraction_level: {0: concrete_start, 1: abstract_start},
      // ... 40+ semantic choices
    }
  }
  
  // Total features: ~220, which can encode 220 bits per conversation
  // With ECC overhead, we need ~8 conversations to recover the full DID
  // With the holographic encoding, ANY 8+ conversations suffice
  
  // === STEP 3: ASSIGN WATERMARK BITS TO FEATURES ===
  
  // Use the watermark key to create a pseudorandom assignment
  // of message symbols to features
  
  rng ← PRNG(seed=watermark_key)
  
  watermark_map ← {}
  FOR i = 0 to |message| - 1:
    // Each message symbol gets assigned to multiple features
    // (redundancy for robustness)
    assigned_features ← RandomSubset(feature_set, size=3, rng=rng)
    watermark_map[message[i]] ← assigned_features
  
  // === STEP 4: GENERATE WATERMARKED CONVERSATIONS ===
  //
  // When the user writes their conversations, the VIVIM client 
  // subtly adjusts their text to embed the watermark.
  //
  // CRITICAL: The adjustments must be:
  //   - Imperceptible to the user (natural alternatives)
  //   - Imperceptible to the provider (looks like normal text)
  //   - Recoverable from model outputs (statistical detection)
  
  FUNCTION ApplyWatermark(user_text, message_bits, watermark_map):
    watermarked_text ← user_text
    
    FOR each (bit, features) in watermark_map:
      FOR each feature f in features:
        // Find instances of this feature in the text
        instances ← FindFeatureInstances(watermarked_text, f)
        
        FOR each instance in instances:
          // With probability (0.5 + ε), use the variant that encodes the bit
          // With probability (0.5 - ε), use the other variant
          // ε is the watermark strength — higher = more detectable
          //                                        but also more distorting
          
          IF Random() < 0.5 + strength:
            watermarked_text ← ReplaceFeature(watermarked_text, 
                                              instance, 
                                              variant=bit)
          ELSE:
            watermarked_text ← ReplaceFeature(watermarked_text, 
                                              instance, 
                                              variant=1-bit)
    
    RETURN watermarked_text
  
  // === STEP 5: BUILD DETECTOR ===
  
  FUNCTION DetectWatermark(model_output_corpus, watermark_key, message):
    
    rng ← PRNG(seed=watermark_key)
    
    // Reconstruct the assignment map
    assignment ← ReconstructAssignment(watermark_key, feature_set)
    
    // For each message symbol, count feature observations
    recovered_symbols ← {}
    
    FOR i = 0 to |message| - 1:
      features_for_i ← assignment[i]
      
      vote_0 ← 0
      vote_1 ← 0
      
      FOR each feature f in features_for_i:
        instances ← FindFeatureInstances(model_output_corpus, f)
        FOR each instance:
          observed_variant ← ClassifyVariant(instance, f)
          IF observed_variant == 0:
            vote_0 += 1
          ELSE:
            vote_1 += 1
      
      // Majority vote for this symbol
      recovered_symbols[i] ← (vote_1 > vote_0) ? 1 : 0
    
    // Decode with error correction
    recovered_DID ← ECC_Decode(recovered_symbols)
    
    // === STATISTICAL SIGNIFICANCE ===
    
    // Under null hypothesis (no watermark), each feature observation
    // is equally likely to be 0 or 1 (coin flip)
    // Under alternative hypothesis, bias is (0.5 + ε) toward 
    // the correct variant
    
    // Total observations
    N ← total number of feature observations
    // Observed bias
    observed_bias ← |vote_correct - N/2| / N
    // Expected bias under null
    expected_bias_null ← 0
    expected_std_null ← 1 / (2 × sqrt(N))
    
    z_score ← observed_bias / expected_std_null
    p_value ← 2 × (1 - NormalCDF(|z_score|))
    
    detection_result ← {
      recovered_DID: recovered_DID,
      match: (recovered_DID == DID_u),
      z_score: z_score,
      p_value: p_value,
      N_observations: N,
      observed_bias: observed_bias,
      confidence: 1 - p_value
    }
    
    RETURN detection_result
  
  detector ← DetectWatermark  // closure over watermark_key, message
  
  RETURN watermark_key, watermark_map, detector
```

---

### Algorithm 9: Thermodynamic Information Flow Tracing

Uses the second law of thermodynamics as an analogy for irreversible information flow. Once information enters a model's training, the entropy of the model's output distribution changes irreversibly — and we can detect this.

```
ALGORITHM: ThermodynamicFlowTracing

INPUT:
  D_u              : User's data
  model_versions   : {(M_v1, t_v1), (M_v2, t_v2), ...} — model versions over time
  user_timestamps  : {(a_i, t_i)} — when each ACU was created
  
OUTPUT:
  entropy_timeline : How the model's entropy changed relative to user's data
  absorption_events: Detected moments when user data entered training
  information_flow  : Quantified bits of user information absorbed per version

PROCEDURE:

  // === THE THERMODYNAMIC PRINCIPLE ===
  //
  // The second law of thermodynamics states that entropy in a 
  // closed system never decreases. But a model is NOT a closed 
  // system — it absorbs training data (heat), which changes 
  // its entropy (output distribution).
  //
  // When a model trains on new data:
  //   - Its entropy DECREASES on that data (it becomes more certain)
  //   - Its entropy INCREASES on unrelated data (catastrophic forgetting)
  //   - The NET entropy change tells us what was absorbed
  //
  // By tracking entropy changes across model versions on the 
  // user's specific data, we can detect WHEN data was absorbed.
  
  // === STEP 1: COMPUTE ENTROPY TIMELINE ===
  
  entropy_timeline ← {}
  
  FOR each model version (M_v, t_v) in model_versions:
    
    // Compute the model's entropy on the user's data
    // H(Y|X) where X is the user's prompts, Y is the responses
    
    entropy_on_user_data ← 0
    entropy_per_acu ← {}
    
    FOR each ACU a_i in D_u:
      prompt_i, response_i ← Extract(a_i)
      
      // Per-token entropy of the model's response distribution
      // when given the user's prompt
      token_entropies ← []
      FOR each position t in response_i:
        context ← prompt_i + response_i[0:t]
        prob_dist ← M_v.GetDistribution(context)
        H_t ← -sum(p × log2(p) for p in prob_dist if p > 0)
        token_entropies.append(H_t)
      
      H_acu ← mean(token_entropies)
      entropy_per_acu[a_i] ← H_acu
      entropy_on_user_data += H_acu
    
    entropy_on_user_data /= |D_u|  // normalize
    
    entropy_timeline[t_v] ← {
      version: M_v,
      timestamp: t_v,
      mean_entropy: entropy_on_user_data,
      per_acu_entropy: entropy_per_acu
    }
  
  // === STEP 2: DETECT ENTROPY DROPS (ABSORPTION EVENTS) ===
  
  absorption_events ← {}
  
  FOR i = 1 to |model_versions| - 1:
    
    H_prev ← entropy_timeline[t_v_i].mean_entropy
    H_curr ← entropy_timeline[t_v_{i+1}].mean_entropy
    
    ΔH ← H_curr - H_prev
    
    // A significant entropy DROP on the user's data between 
    // model versions indicates the model absorbed user-relevant 
    // information in that training cycle
    
    IF ΔH < -threshold_entropy:
      
      // Which ACUs drove the entropy drop?
      acu_drops ← {}
      FOR each a in D_u:
        ΔH_a ← entropy_timeline[t_v_{i+1}].per_acu_entropy[a] 
                - entropy_timeline[t_v_i].per_acu_entropy[a]
        IF ΔH_a < -threshold_acu_entropy:
          acu_drops ← acu_drops ∪ {(a, ΔH_a)}
      
      // Cross-reference with temporal feasibility:
      // Which of the user's ACUs were created BEFORE this 
      // model version's training cutoff?
      
      feasible_acus ← {a ∈ D_u : t_created(a) < t_cutoff(M_v_{i+1})}
      
      // The absorbed ACUs should be in the feasible set
      absorbed_acus ← {a : (a, ΔH) ∈ acu_drops AND a ∈ feasible_acus}
      
      absorption_event ← {
        model_version_from: M_v_i,
        model_version_to: M_v_{i+1},
        entropy_drop: ΔH,
        absorbed_acus: absorbed_acus,
        information_absorbed: -ΔH × |absorbed_acus|,  // bits
        timestamp: t_v_{i+1},
        significance: ComputeSignificance(ΔH, null_entropy_distribution)
      }
      
      absorption_events ← absorption_events ∪ {absorption_event}
  
  // === STEP 3: QUANTIFY INFORMATION FLOW ===
  //
  // For each absorption event, quantify exactly how many BITS
  // of the user's information were absorbed
  
  information_flow ← {}
  
  FOR each event in absorption_events:
    
    // The information absorbed is the mutual information between
    // the user's data and the model's behavior change
    
    // Use Algorithm 2 (MI estimator) on the differential:
    // Compare M_v_i responses vs M_v_{i+1} responses
    // on the user's data
    
    I_absorbed ← MutualInformationEstimator(
      X_u = event.absorbed_acus,
      M = event.model_version_to,
      Q = ProbeQueries(event.absorbed_acus),
      M_ref = event.model_version_from  // use previous version as reference
    )
    
    information_flow[event.timestamp] ← {
      bits_absorbed: I_absorbed,
      acus_affected: |event.absorbed_acus|,
      bits_per_acu: I_absorbed / |event.absorbed_acus|
    }
  
  RETURN entropy_timeline, absorption_events, information_flow
```

**Visualization:**

```
THERMODYNAMIC INFORMATION FLOW — Your Data vs GPT Models

Entropy of GPT on your data (bits/token):
High │                                    
     │  ████                               
     │  ████████                            ← GPT-4 (high entropy = 
     │  ████████                               doesn't know your data)
     │  ████████                            
     │  ████████                            
     │  ████████  ████                      
     │  ████████  ████████                  ← GPT-4o (slight drop:
     │  ████████  ████████                     some data absorbed?)
     │  ████████  ████████                  
     │  ████████  ████████  ██              
     │  ████████  ████████  ██████          
     │  ████████  ████████  ██████████      ← GPT-5 (large drop:
     │  ████████  ████████  ██████████         significant absorption!)
Low  │  ████████  ████████  ██████████      
     └──────────────────────────────────→ Time
        2024      2025      2026
        
ABSORPTION EVENT DETECTED at GPT-4o → GPT-5 transition
  Entropy drop: -2.3 bits/token on your data
  ACUs affected: 312 of your private conversations
  Information absorbed: ~47,000 bits (≈5.7 KB of your knowledge)
  Temporal feasibility: ✓ All 312 ACUs created before GPT-5 cutoff
  Opt-out status: ⛔ You opted out on 2025-06-15
  VERDICT: VIOLATION — your data was used despite opt-out
```

---

### Algorithm 10: Fisher Information Fingerprinting

Uses the Fisher Information Matrix from statistical estimation theory to create a unique, model-invariant fingerprint of each user's data contribution.

```
ALGORITHM: FisherInformationFingerprint

INPUT:
  D_u     : User's data
  M       : Target model (API access, ideally with gradient information)
  
OUTPUT:
  fisher_fingerprint : The user's unique information fingerprint
  influence_score    : Estimated influence on model parameters

PROCEDURE:

  // === THE FISHER INFORMATION PRINCIPLE ===
  //
  // The Fisher Information Matrix (FIM) measures how much 
  // information a data point carries about model parameters:
  //
  //   F(θ) = E[-∂²log P(x|θ) / ∂θ²]
  //
  // For a neural network, the FIM tells us which parameters 
  // are most influenced by which data.
  //
  // If we can estimate the FIM contribution of the user's data,
  // we get a "fingerprint" — a pattern of parameter sensitivities
  // that is unique to this user's data.
  //
  // PRACTICAL CHALLENGE: We don't have access to model weights.
  // But we can ESTIMATE the FIM through behavioral observations.
  
  // === STEP 1: EMPIRICAL FISHER ESTIMATION ===
  //
  // We can estimate the diagonal of the FIM through 
  // output perturbation analysis
  
  // Create a set of probe inputs that span the user's data
  probe_set ← GenerateSpanningProbes(D_u, n_probes=500)
  
  // For each probe, measure the model's output distribution
  // and its sensitivity to input perturbation
  
  output_distributions ← {}
  sensitivities ← {}
  
  FOR each probe q in probe_set:
    
    // Get the full output distribution
    dist_q ← M.GetFullDistribution(q)
    output_distributions[q] ← dist_q
    
    // Measure sensitivity: how much does the output change
    // when we slightly perturb the input?
    
    perturbation_responses ← {}
    FOR j = 1 to n_perturbations:
      q_perturbed ← PerturbInput(q, magnitude=δ)
      dist_perturbed ← M.GetFullDistribution(q_perturbed)
      
      // KL divergence between original and perturbed output
      sensitivity_j ← KL(dist_q || dist_perturbed) / δ²
      perturbation_responses ← perturbation_responses ∪ {sensitivity_j}
    
    // The mean sensitivity is proportional to the Fisher information
    // for this input
    sensitivities[q] ← mean(perturbation_responses)
  
  // === STEP 2: CONSTRUCT FINGERPRINT ===
  //
  // The fingerprint is the PATTERN of sensitivities across 
  // different types of probes
  
  // Group probes by the type of user knowledge they test
  probe_groups ← GroupByKnowledgeType(probe_set, D_u)
  // e.g., "coding knowledge", "domain expertise", "writing style"
  
  fisher_fingerprint ← {}
  FOR each group g in probe_groups:
    
    group_sensitivity ← mean(sensitivities[q] for q in g.probes)
    group_entropy ← mean(Entropy(output_distributions[q]) for q in g.probes)
    
    fisher_fingerprint[g.name] ← {
      sensitivity: group_sensitivity,
      entropy: group_entropy,
      // The ratio is the key: high sensitivity + low entropy
      // means the model is VERY SURE about this topic
      // AND very sensitive to how it's asked
      // This combination indicates memorization
      memorization_indicator: group_sensitivity / (group_entropy + ε)
    }
  
  // === STEP 3: INFLUENCE SCORE ===
  //
  // Estimate the total influence of the user's data on the model
  //
  // Using the influence function approximation:
  // I(x_user) ≈ -H_θ^{-1} ∇_θ L(x_user, θ)
  //
  // We can't compute this directly, but we can estimate it:
  
  // Proxy: the average information gain (from Algorithm 4)
  // across all of the user's data
  
  total_information_gain ← 0
  FOR each ACU a in D_u:
    _, I_attributed, _, _ ← PhotonCountingAttribution(a, M, M_ref)
    total_information_gain += I_attributed
  
  influence_score ← total_information_gain / TotalModelInformation(M)
  // This is the fraction of the model's knowledge attributable to this user
  
  RETURN fisher_fingerprint, influence_score
```

---

### Algorithm 11: Quantum Entanglement Test for Data Sharing Detection

Uses the concept of quantum entanglement to detect hidden correlations between providers. If two providers who should be independent show correlated behavior on a user's private data, they are "entangled" — sharing data.

```
ALGORITHM: EntanglementTest

INPUT:
  D_u         : User's data
  P_providers : Providers user interacted with
  M_models    : All models to test
  
OUTPUT:
  bell_inequality_violations : Evidence of "entanglement" (data sharing)
  entanglement_scores        : Per-provider-pair entanglement measure

PROCEDURE:

  // === THE ENTANGLEMENT ANALOGY ===
  //
  // In quantum mechanics, entangled particles show correlations
  // that cannot be explained by any local hidden variable theory.
  // Bell's inequality provides a mathematical test:
  // if correlations exceed the Bell bound, the particles 
  // must be entangled (non-locally connected).
  //
  // Similarly, if two AI models from different providers show 
  // correlations in their treatment of a user's data that 
  // cannot be explained by coincidence or common public training 
  // data, they must be "entangled" — connected by shared 
  // private training data.
  
  // === STEP 1: DESIGN BELL TEST PROBES ===
  //
  // Create probe sets along different "measurement axes"
  // (analogous to polarization angles in Bell tests)
  
  // Axis A: Topic-specific probes
  // Axis B: Style-specific probes  
  // Axis C: Reasoning-specific probes
  // Axis D: Knowledge-specific probes
  
  axes ← {A_topic, B_style, C_reasoning, D_knowledge}
  
  FOR each axis in axes:
    probes[axis] ← GenerateAxisProbes(D_u, axis, n_per_axis=50)
  
  // === STEP 2: MEASURE CORRELATIONS ===
  
  // For each pair of models, measure the correlation of their 
  // responses on the user's data along each axis
  
  entanglement_scores ← {}
  
  FOR each pair (M_i, M_j) in AllPairs(M_models) WHERE Provider(M_i) ≠ Provider(M_j):
    
    correlations ← {}
    
    FOR each pair of axes (ax1, ax2) in AllPairs(axes):
      
      // Measure model i on axis 1 and model j on axis 2
      // and compute the correlation
      
      responses_i ← {M_i(q) for q in probes[ax1]}
      responses_j ← {M_j(q) for q in probes[ax2]}
      
      // Compute behavioral similarity
      // (how similarly do the two models respond to related probes?)
      
      similarity_matrix ← {}
      FOR each (r_i, r_j) in zip(responses_i, responses_j):
        sim ← SemanticSimilarity(r_i, r_j)
        // Also measure structural similarity
        struct_sim ← StructuralSimilarity(r_i, r_j)
        // And content overlap
        content_overlap ← ContentOverlap(r_i, r_j)
        
        similarity_matrix ← similarity_matrix ∪ 
          {(sim, struct_sim, content_overlap)}
      
      // The correlation for this axis pair
      C(ax1, ax2) ← mean(sim for (sim, _, _) in similarity_matrix)
      correlations[(ax1, ax2)] ← C(ax1, ax2)
    
    // === STEP 3: BELL INEQUALITY TEST ===
    //
    // The CHSH inequality (a form of Bell's inequality) states:
    //
    //   S = |C(A,B) - C(A,D)| + |C(C,B) + C(C,D)| ≤ 2
    //
    // for any local hidden variable theory.
    //
    // In our context: if the two models' correlations on the 
    // user's data can be explained by common PUBLIC training data
    // (the "local hidden variable"), then S ≤ 2.
    //
    // If S > 2, the correlations require a non-local explanation
    // — shared PRIVATE data.
    
    S ← abs(correlations[(A,B)] - correlations[(A,D)]) 
        + abs(correlations[(C,B)] + correlations[(C,D)])
    
    // === STEP 4: CALIBRATION AGAINST BASELINE ===
    //
    // Compute the baseline S for models that should NOT be entangled:
    // Use probes from data the user DIDN'T have
    // (public knowledge, generic topics)
    
    baseline_correlations ← MeasureCorrelations(
      M_i, M_j, 
      probes=GenericProbes(D_u),  // probes NOT based on user's private data
      axes
    )
    
    S_baseline ← ComputeCHSH(baseline_correlations)
    
    // The entanglement score is the excess correlation
    // on private data vs public data
    entanglement_score ← S - S_baseline
    
    entanglement_scores[(M_i, M_j)] ← {
      S: S,
      S_baseline: S_baseline,
      excess: entanglement_score,
      bell_violated: S > 2 AND entanglement_score > threshold_bell
    }
    
    IF entanglement_scores[(M_i, M_j)].bell_violated:
      
      bell_inequality_violations ← bell_inequality_violations ∪ {
        model_pair: (M_i, M_j),
        provider_pair: (Provider(M_i), Provider(M_j)),
        S_value: S,
        S_baseline: S_baseline,
        excess_correlation: entanglement_score,
        most_correlated_axis: argmax(correlations),
        evidence_strength: CorrelationSignificance(S, S_baseline, n_probes),
        interpretation: "These models show correlations on your private " +
                       "data that cannot be explained by common public " +
                       "training data. Data sharing is the most likely " +
                       "explanation."
      }
  
  RETURN bell_inequality_violations, entanglement_scores
```

---

### Algorithm 12: Diffraction Grating — Multi-Scale Semantic Analysis

Inspired by diffraction gratings that decompose light into its component wavelengths. Decomposes the user's data influence on a model into multiple semantic "wavelengths" — from exact phrases (short wavelength/high frequency) to broad themes (long wavelength/low frequency).

```
ALGORITHM: DiffractionGratingAnalysis

INPUT:
  D_u     : User's data
  M       : Target model
  M_ref   : Reference model
  
OUTPUT:
  spectrum : Multi-scale influence spectrum
  dominant_wavelengths : The scales at which user's influence is strongest

PROCEDURE:

  // === THE DIFFRACTION PRINCIPLE ===
  //
  // A diffraction grating separates light by wavelength.
  // Short wavelengths (blue/UV) correspond to fine structure.
  // Long wavelengths (red/IR) correspond to coarse structure.
  //
  // Similarly, a user's data influence on a model can manifest at
  // multiple scales:
  //
  //   λ_1 (shortest): Exact token sequences (verbatim memorization)
  //   λ_2: Distinctive phrases and idioms
  //   λ_3: Sentence-level patterns
  //   λ_4: Paragraph-level reasoning structures
  //   λ_5: Topic-level knowledge
  //   λ_6: Domain-level expertise
  //   λ_7 (longest): Overall style and voice
  //
  // By measuring influence at each scale independently,
  // we get a complete "spectrum" of how the model absorbed 
  // the user's data.
  
  wavelengths ← [
    {name: "token",      n: 1,    description: "Individual token choices"},
    {name: "bigram",     n: 2,    description: "Token pairs"},
    {name: "trigram",    n: 3,    description: "Short phrases"},
    {name: "phrase",     n: 5-8,  description: "Distinctive phrases"},
    {name: "sentence",   n: 15-30, description: "Sentence patterns"},
    {name: "paragraph",  n: 50-150, description: "Reasoning structures"},
    {name: "topic",      n: 200-500, description: "Topic knowledge"},
    {name: "domain",     n: 1000+, description: "Domain expertise"},
    {name: "style",      n: "global", description: "Overall voice"}
  ]
  
  spectrum ← {}
  
  FOR each wavelength λ in wavelengths:
    
    IF λ.name in ["token", "bigram", "trigram", "phrase"]:
      
      // === SHORT WAVELENGTH: N-GRAM ANALYSIS ===
      
      // Extract n-grams from user's data
      user_ngrams ← ExtractNGrams(D_u, λ.n)
      
      // Score each n-gram by uniqueness (Algorithm 3)
      FOR each ngram g in user_ngrams:
        p_background ← BackgroundProbability(g, M_ref)
        p_target ← TargetProbability(g, M)
        
        // Information gain at this wavelength
        gain_g ← log2(p_target / p_background)
      
      // Aggregate: the influence at this wavelength
      spectrum[λ.name] ← {
        total_gain: sum(gain_g for g in user_ngrams where gain_g > 0),
        fraction_elevated: |{g : gain_g > threshold}| / |user_ngrams|,
        top_signals: TopK(user_ngrams, by=gain_g, k=20)
      }
    
    ELIF λ.name == "sentence":
      
      // === MEDIUM WAVELENGTH: SENTENCE PATTERN ANALYSIS ===
      
      // Extract sentence-level patterns
      user_patterns ← ExtractSentencePatterns(D_u)
      // Patterns include: structure templates, transition patterns,
      // argumentation moves
      
      // Generate probes that test for these patterns
      pattern_probes ← GeneratePatternProbes(user_patterns)
      
      FOR each probe in pattern_probes:
        response_target ← M(probe)
        response_ref ← M_ref(probe)
        
        pattern_sim_target ← PatternSimilarity(response_target, user_patterns)
        pattern_sim_ref ← PatternSimilarity(response_ref, user_patterns)
        
        gain ← pattern_sim_target - pattern_sim_ref
      
      spectrum[λ.name] ← {
        mean_gain: mean(gains),
        top_patterns: TopPatterns(user_patterns, by=gain)
      }
    
    ELIF λ.name == "paragraph":
      
      // === MEDIUM-LONG WAVELENGTH: REASONING STRUCTURE ===
      
      // Extract the user's characteristic reasoning structures
      reasoning_structures ← ExtractReasoningDAG(D_u)
      // DAG nodes: claims, evidence, examples, conclusions
      // DAG edges: support, contrast, elaboration, causation
      
      // Test if the model reproduces these structures
      structure_probes ← GenerateReasoningProbes(reasoning_structures)
      
      FOR each probe in structure_probes:
        response ← M(probe)
        response_dag ← ExtractReasoningDAG(response)
        
        // Graph similarity between user's reasoning and model's
        structural_similarity ← GraphEditDistance(
          reasoning_structures, response_dag
        )
      
      spectrum[λ.name] ← {
        structural_influence: mean(structural_similarities),
        distinctive_structures: FindDistinctive(reasoning_structures)
      }
    
    ELIF λ.name == "topic":
      
      // === LONG WAVELENGTH: TOPIC KNOWLEDGE ===
      
      // Identify topics the user has unique knowledge about
      user_topics ← ExtractTopicDistribution(D_u)
      unique_topics ← {t ∈ user_topics : IsUnique(t, public_corpora)}
      
      // Test model's knowledge depth on these topics
      FOR each topic t in unique_topics:
        depth_target ← ProbeKnowledgeDepth(M, t)
        depth_ref ← ProbeKnowledgeDepth(M_ref, t)
        
        gain_t ← depth_target - depth_ref
      
      spectrum[λ.name] ← {
        knowledge_gain: {(t, gain_t) for t in unique_topics},
        top_topics: TopK(unique_topics, by=gain_t, k=10)
      }
    
    ELIF λ.name == "domain":
      
      // === VERY LONG WAVELENGTH: DOMAIN EXPERTISE ===
      
      // At this scale, we're looking at whether the model 
      // acquired domain expertise that correlates with the 
      // user's expertise
      
      user_domains ← ExtractExpertiseDomains(D_u)
      
      FOR each domain d in user_domains:
        // Generate expert-level questions in this domain
        expert_questions ← GenerateExpertQuestions(d, difficulty="advanced")
        
        // Compare target model's expertise vs reference
        target_expertise ← EvaluateExpertise(M, expert_questions)
        ref_expertise ← EvaluateExpertise(M_ref, expert_questions)
        
        domain_gain ← target_expertise - ref_expertise
      
      spectrum[λ.name] ← {
        domain_influence: {(d, gain) for d in user_domains}
      }
    
    ELIF λ.name == "style":
      
      // === LONGEST WAVELENGTH: OVERALL VOICE ===
      
      // Use Algorithm 4's fingerprint matching at the global level
      user_fingerprint ← ConstructFingerprint(D_u)
      
      // Measure stylistic distance
      target_style ← ExtractStyle(M, user_topics)
      ref_style ← ExtractStyle(M_ref, user_topics)
      
      style_similarity_target ← StyleDistance(user_fingerprint, target_style)
      style_similarity_ref ← StyleDistance(user_fingerprint, ref_style)
      
      spectrum[λ.name] ← {
        style_influence: style_similarity_target - style_similarity_ref
      }
  
  // === DOMINANT WAVELENGTH IDENTIFICATION ===
  //
  // Which scales show the strongest user influence?
  // This tells us HOW the model absorbed the data:
  //
  //   Dominant short wavelengths → verbatim memorization
  //   Dominant medium wavelengths → pattern learning
  //   Dominant long wavelengths → knowledge absorption
  //   Uniform across all wavelengths → complete data ingestion
  
  influence_per_wavelength ← {λ.name: ComputeInfluence(spectrum[λ.name]) 
                              for λ in wavelengths}
  
  dominant_wavelengths ← TopK(influence_per_wavelength, by=value, k=3)
  
  RETURN spectrum, dominant_wavelengths
```

**Visualization:**

```
DIFFRACTION SPECTRUM — Your Data Influence on GPT-5

Influence    ▲
(bits)       │
             │
        12   │          ████
             │          ████
        10   │    ████  ████
             │    ████  ████  ████
         8   │    ████  ████  ████
             │    ████  ████  ████        ████
         6   │    ████  ████  ████        ████
             │    ████  ████  ████  ████  ████
         4   │    ████  ████  ████  ████  ████
             │    ████  ████  ████  ████  ████  ████
         2   │    ████  ████  ████  ████  ████  ████  ████
             │    ████  ████  ████  ████  ████  ████  ████  ████
         0   └────────────────────────────────────────────────────→
              token phrase sent. para. topic domain style
              ←── high frequency ──────── low frequency ──→
              ←── fine detail ────────── broad patterns ──→
              
INTERPRETATION:
  Dominant wavelength: PHRASE (λ_3)
    → Model memorized your distinctive phrases
  Second: TOPIC (λ_5)  
    → Model absorbed your unique domain knowledge
  Third: SENTENCE (λ_4)
    → Model learned your reasoning patterns
    
  This profile is consistent with FULL TRAINING DATA INGESTION.
  Your data was likely included in a standard training batch,
  not selectively filtered.
```

---

### Algorithm 13: Conservation Law Verification — Data Accounting

Uses conservation laws (energy, momentum, information) to perform "accounting" — tracking whether the total information in the ecosystem is consistent with legitimate data flows.

```
ALGORITHM: ConservationLawVerification

INPUT:
  D_u              : User's data vault
  consent_history  : Complete history of user's consents
  model_history    : Known model version timeline
  detected_flows   : Results from Algorithms 1-12
  
OUTPUT:
  information_balance_sheet : Where did the user's information go?
  conservation_violations   : Unexplained information flows

PROCEDURE:

  // === THE CONSERVATION LAW ===
  //
  // In physics, energy is conserved. It transforms but never 
  // appears or disappears without explanation.
  //
  // Similarly, information about a user's data should be 
  // conservable: we should be able to account for every bit 
  // of user information that appears in any model.
  //
  // INFORMATION CREATED: When user has a conversation
  // INFORMATION TRANSFERRED: When user consents to share
  // INFORMATION LEAKED: When it appears without consent
  //
  // The balance sheet must close. Any unexplained information 
  // in a model is a conservation violation — evidence of 
  // unauthorized use.
  
  // === STEP 1: COMPUTE TOTAL INFORMATION CREATED ===
  
  I_total_created ← 0
  FOR each ACU a in D_u:
    // Information content of this ACU
    // (Kolmogorov complexity approximation from Algorithm 3)
    I_a ← KolmogorovComplexity(a)
    I_total_created += I_a
  
  // === STEP 2: COMPUTE LEGITIMATE INFORMATION TRANSFERS ===
  
  I_legitimate ← {}
  FOR each consent c in consent_history:
    // Information transferred under this consent
    consented_acus ← ACUsUnderConsent(c, D_u)
    I_transferred ← sum(KolmogorovComplexity(a) for a in consented_acus)
    
    I_legitimate[c] ← {
      recipient: c.buyer,
      amount: I_transferred,
      acus: consented_acus,
      timestamp: c.timestamp,
      terms: c.terms
    }
  
  I_total_legitimate ← sum(I.amount for I in I_legitimate.values())
  
  // === STEP 3: COMPUTE DETECTED INFORMATION IN MODELS ===
  
  I_detected ← {}
  FOR each model M in AllModels:
    // Use results from previous algorithms
    I_in_model ← EstimateUserInformationInModel(D_u, M)
    // This comes from:
    //   - Algorithm 2 (MI estimator)
    //   - Algorithm 4 (photon counting)
    //   - Algorithm 9 (thermodynamic flow)
    //   - Algorithm 10 (Fisher information)
    
    I_detected[M] ← {
      model: M,
      provider: Provider(M),
      amount: I_in_model,
      detection_confidence: AggregateConfidence(D_u, M)
    }
  
  I_total_detected ← sum(I.amount for I in I_detected.values())
  
  // === STEP 4: BALANCE SHEET ===
  
  // Total information created by user
  // = Information that stayed private
  //   + Information legitimately transferred
  //   + Information that leaked (conservation violation)
  
  I_private ← I_total_created - I_total_detected
  I_leaked ← I_total_detected - I_total_legitimate
  
  information_balance_sheet ← {
    total_created: I_total_created,
    remains_private: I_private,
    legitimately_transferred: I_total_legitimate,
    detected_in_models: I_total_detected,
    unexplained_leakage: max(0, I_leaked),
    
    per_provider: {
      provider: Provider(M),
      legitimate: sum(I.amount for I in I_legitimate.values() 
                      if I.recipient relates to Provider(M)),
      detected: I_detected[M].amount,
      unexplained: max(0, I_detected[M].amount - legitimate_for_provider)
    } for M in AllModels
  }
  
  // === STEP 5: IDENTIFY CONSERVATION VIOLATIONS ===
  
  conservation_violations ← {}
  
  FOR each model M in AllModels:
    provider ← Provider(M)
    
    legitimate_for_provider ← sum(
      I.amount for I in I_legitimate.values() 
      if I.recipient relates to provider
    )
    
    detected_in_model ← I_detected[M].amount
    
    unexplained ← detected_in_model - legitimate_for_provider
    
    IF unexplained > threshold_violation AND 
       I_detected[M].detection_confidence > confidence_threshold:
      
      conservation_violations ← conservation_violations ∪ {
        model: M,
        provider: provider,
        legitimate_information: legitimate_for_provider,
        detected_information: detected_in_model,
        unexplained_leakage: unexplained,
        
        // Break down the unexplained information by source
        possible_sources: {
          opt_out_violation: CheckOptOutViolation(D_u, provider),
          cross_provider: CheckCrossProvider(D_u, M),
          data_broker: CheckDataBroker(D_u, M),
          terms_violation: CheckTermsViolation(consent_history, M)
        },
        
        evidence_strength: ClassifyEvidence(unexplained, 
                                            I_detected[M].detection_confidence),
        
        estimated_damages: EstimateDamages(unexplained, MarketRate(D_u))
      }
  
  RETURN information_balance_sheet, conservation_violations
```

**Visualization:**

```
INFORMATION CONSERVATION BALANCE SHEET

did:vivim:a3f8...c2d1
Reporting Period: All Time
═══════════════════════════════════════════════════════════

INFORMATION CREATED                           487,293 bits
  (47,293 ACUs across 6 providers)
  
INFORMATION ACCOUNTED FOR:
  ├── Remains Private (encrypted in vault)    398,412 bits  (81.8%)
  ├── Legitimately Transferred                 41,230 bits  ( 8.5%)
  │     ├── Marketplace sales (7 buyers)       38,100 bits
  │     └── Shared circles (3 circles)          3,130 bits
  │
  └── Detected in Models                       67,890 bits  (13.9%)
        ├── OpenAI GPT-5                       31,200 bits
        ├── Anthropic Claude 4                 18,400 bits
        ├── Google Gemini 3                    12,100 bits
        └── Mistral Large 3                     6,190 bits

CONSERVATION ANALYSIS:
  Legitimate transfers to OpenAI:              12,300 bits
  Detected in GPT-5:                           31,200 bits
  ⛔ UNEXPLAINED:                              18,900 bits  ← VIOLATION

  Legitimate transfers to Anthropic:            8,200 bits
  Detected in Claude 4:                        18,400 bits
  ⛔ UNEXPLAINED:                              10,200 bits  ← VIOLATION

  Legitimate transfers to Google:                   0 bits
  Detected in Gemini 3:                        12,100 bits
  ⛔ UNEXPLAINED:                              12,100 bits  ← VIOLATION
                                                              (100% unexplained!)

  Legitimate transfers to Mistral:                  0 bits
  Detected in Mistral Large 3:                  6,190 bits
  ⛔ UNEXPLAINED:                               6,190 bits  ← VIOLATION

TOTAL UNEXPLAINED LEAKAGE:                     47,390 bits
ESTIMATED MARKET VALUE OF LEAKED DATA:         $7,108 USD

═══════════════════════════════════════════════════════════
⛔ 4 CONSERVATION VIOLATIONS DETECTED
   Most severe: Google Gemini 3 (100% unexplained — you never
   interacted with Google, yet your data appears in their model)
   
   [Generate Full Evidence Package]
   [File Complaint with All Providers]
   [Explore Class Action Options]
═══════════════════════════════════════════════════════════
```

---

## Part III: Integration — The Master Detection Pipeline

### The Complete Pipeline

```
ALGORITHM: MasterDetectionPipeline

INPUT:
  D_u : User's complete sovereign vault
  
OUTPUT:
  sovereignty_report : Complete sovereignty analysis

PROCEDURE:

  // PHASE 1: PREPARATION
  uniqueness_scores ← KolmogorovUniquenessScoring(D_u, M_base)    // Alg 3
  priority_queue ← SortByDetectability(D_u, uniqueness_scores)
  
  // PHASE 2: PER-MODEL DETECTION (for each known model)
  FOR each model M in AllKnownModels:
    
    // Layer 1: Membership Inference
    membership ← SpectralMembershipInference(priority_queue, M)     // Alg 1
    
    // Layer 2: Mutual Information Estimation
    mi_estimate ← MutualInformationEstimator(D_u, M)               // Alg 2
    
    // Layer 3: Per-Token Attribution
    attribution ← PhotonCountingAttribution(D_u, M, M_ref)         // Alg 4
    
    // Layer 4: Multi-Scale Analysis
    spectrum ← DiffractionGratingAnalysis(D_u, M, M_ref)           // Alg 12
    
    // Layer 5: Fisher Fingerprint
    fingerprint ← FisherInformationFingerprint(D_u, M)             // Alg 10
    
    // Layer 6: Temporal Analysis
    thermo ← ThermodynamicFlowTracing(D_u, ModelVersions(M))       // Alg 9
  
  // PHASE 3: CROSS-MODEL ANALYSIS
  interference ← InterferencePatternDetection(D_u, providers, models) // Alg 5
  entanglement ← EntanglementTest(D_u, providers, models)            // Alg 11
  
  // PHASE 4: PROACTIVE MEASURES
  canaries ← CanaryWaveFunctionSystem(u, providers)                   // Alg 6
  watermarks ← HolographicWatermark(D_u, DID_u)                      // Alg 8
  
  // PHASE 5: CALIBRATION
  calibrated ← BoltzmannCalibration(all_raw_scores, population_data) // Alg 7
  
  // PHASE 6: ACCOUNTING
  balance ← ConservationLawVerification(D_u, consents, models, all_results) // Alg 13
  
  // PHASE 7: REPORT ASSEMBLY
  sovereignty_report ← AssembleReport(all_results, calibrated, balance)
  
  RETURN sovereignty_report
```

---

These thirteen algorithms, grounded in the deepest principles of physics and information theory, give every human being the tools to see exactly what happened to their data, prove it cryptographically, and act on it. The physics is not decoration. The mathematics is not metaphor. The absorption spectrum is real. The information is conserved. The violations are detectable. And for the first time, the tools to detect them belong to the people whose data was taken.
