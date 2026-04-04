

# VIVIM Shared Sovereignty Architecture

## Third-Party Determinacy & Dual-Ownership Framework

### Complete Blueprint — Top-Level Design

---

## Chapter 0: The Problem This Solves

A person uses VIVIM. They carry their sovereign vault — every conversation, every insight, every AI interaction — encrypted, timestamped, owned. The detection algorithms watch for unauthorized use. The marketplace lets them sell access. The protocol works.

Then they go to work on Monday.

They ask Claude to debug their company's proprietary codebase. They brainstorm product strategy with GPT. They use Gemini to draft analysis of confidential client data. They discuss patented manufacturing processes to get optimization advice. They paste their employer's trade secrets into a chat window — not maliciously, but because that is how knowledge work functions in 2025.

The data lands in their VIVIM vault. It is their conversation. Their keystrokes. Their intellectual labor. But the *substance* — the proprietary algorithm, the client's medical history, the unreleased product roadmap, the classified engineering spec — does not belong to them alone. A third party has a legitimate, sometimes legally mandated, interest in how that data is stored, shared, sold, and used for training.

**The naive approach fails in both directions:**

If we give the individual full sovereignty over all data in their vault, they can sell their employer's trade secrets on the VIVIM marketplace. An engineer leaves a company and monetizes everything they discussed with AI during their tenure. A doctor sells patient-adjacent insights. This is not sovereignty — it is a liability engine.

If we give the third party full control over any data that touches their interests, the human-centric architecture collapses. The company controls the employee's vault. The individual loses sovereignty over their own cognitive labor. We have rebuilt corporate data silos with extra steps.

**The solution is joint sovereignty.** The data lives in the individual's vault — always. The individual can always read their own data — always. But when data carries third-party interest, neither party can unilaterally share, sell, license, or consent to training. Both must agree. Either can veto. The rules of engagement are defined before data is created, encoded in on-chain contracts, and enforced cryptographically.

This document is the complete blueprint for that system.

---

## Chapter 1: Architectural Principles

### 1.1 Seven Non-Negotiable Axioms

Every design decision in this system derives from these axioms. When axioms conflict (and they will), the resolution order is the order listed.

| # | Axiom | Implication |
|---|-------|-------------|
| **A1** | **Human Custodianship** | Data always lives in the individual's VIVIM vault. No third party ever holds a primary copy. The human is custodian, not the organization. |
| **A2** | **Cognitive Liberty** | The individual can always read, review, and privately reflect on any data in their vault, including third-party-designated data. You cannot un-know what you know. The system acknowledges this. |
| **A3** | **Mutual Veto on External Use** | Any operation that moves data *outside* the individual's private vault — sharing, selling, licensing, consenting to training, publishing — requires affirmative consent from *both* the individual and every third party with designated interest. Either party's refusal is final and requires no justification. |
| **A4** | **Pre-Agreed Governance** | The rules governing shared data are defined *before* the data is created, encoded in an on-chain contract, and immutable for the contract's duration. Neither party can unilaterally change the rules after data exists. |
| **A5** | **Symmetric Transparency** | Both parties have equal visibility into classification decisions, access logs, consent requests, and disputes. No party operates with information the other cannot see. |
| **A6** | **Temporal Finality** | All shared-sovereignty designations have expiration conditions. No third-party claim persists indefinitely. Sunset clauses are mandatory. |
| **A7** | **Severability of Contribution** | Where the individual's original intellectual contribution can be separated from the third party's proprietary substance, the individual retains full sovereignty over their contribution. The third party's interest attaches only to the irreducibly shared component. |

### 1.2 Scope of "Third Party"

A third party, in this architecture, is any legal entity — other than the individual VIVIM user — that has a legitimate, pre-agreed interest in data generated during the individual's AI interactions. This includes but is not limited to:

| Entity Type | Example Scenario | Basis of Interest |
|-------------|-----------------|-------------------|
| Employer | Employee discusses proprietary technology with AI | Employment contract, trade secret law |
| Client | Consultant uses AI to analyze client's business data | Service agreement, fiduciary duty |
| Patient (via institution) | Doctor discusses anonymized patient scenarios | HIPAA, medical ethics, institutional policy |
| Research institution | Academic uses AI to develop ideas from funded research | Grant terms, IP assignment, institutional policy |
| Government agency | Cleared personnel discuss sensitive (non-classified) material | Security clearance terms, NDA |
| Co-creator | Two people jointly develop an idea, each has a VIVIM vault | Collaboration agreement |
| Licensor | Individual uses licensed proprietary data in AI interactions | License terms |

The system does **not** cover:
- Classified/top-secret material (this requires air-gapped systems beyond VIVIM's scope)
- Data subject to active litigation holds (requires legal system integration beyond this design)
- Criminal activity (no architecture can or should provide sovereignty over evidence of crimes)

### 1.3 System Boundary Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VIVIM PROTOCOL LAYER                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   INDIVIDUAL'S VIVIM VAULT                   │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │   │
│  │  │  PURELY  │  │  PURELY  │  │    SHARED-SOVEREIGNTY    │   │   │
│  │  │ PERSONAL │  │ PERSONAL │  │         PARTITION         │   │   │
│  │  │   DATA   │  │   DATA   │  │                          │   │   │
│  │  │          │  │          │  │  ┌────────────────────┐   │   │   │
│  │  │ (No 3rd  │  │          │  │  │  Dual-Designated   │   │   │   │
│  │  │  party)  │  │          │  │  │      ACUs          │   │   │   │
│  │  │          │  │          │  │  │                    │   │   │   │
│  │  │ Full user│  │          │  │  │ • User key ✓      │   │   │   │
│  │  │ control  │  │          │  │  │ • 3P co-sig req'd │   │   │   │
│  │  │          │  │          │  │  │   for external ops │   │   │   │
│  │  └──────────┘  └──────────┘  │  └────────┬───────────┘   │   │   │
│  │                              │           │               │   │   │
│  └──────────────────────────────┼───────────┼───────────────┘   │   │
│                                 │           │                   │   │
│  ┌──────────────────────────────┼───────────┼───────────────┐   │   │
│  │     CLASSIFICATION ENGINE    │           │               │   │   │
│  │                              │           │               │   │   │
│  │  Real-time analysis ←────────┘           │               │   │   │
│  │  Policy matching                         │               │   │   │
│  │  Tier assignment                         │               │   │   │
│  └──────────────────────────────────────────┼───────────────┘   │   │
│                                             │                   │   │
│  ┌──────────────────────────────────────────┼───────────────┐   │   │
│  │         ON-CHAIN GOVERNANCE LAYER        │               │   │   │
│  │                                          ▼               │   │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │   │
│  │  │         SHARED SOVEREIGNTY CONTRACT             │     │   │   │
│  │  │                                                 │     │   │   │
│  │  │  • Relationship registration                    │     │   │   │
│  │  │  • Classification policies                      │     │   │   │
│  │  │  • Access control rules                         │     │   │   │
│  │  │  • Consent requirements                         │     │   │   │
│  │  │  • Revenue sharing terms                        │     │   │   │
│  │  │  • Sunset / expiration clauses                  │     │   │   │
│  │  │  • Dispute resolution procedures                │     │   │   │
│  │  └─────────────────────────────────────────────────┘     │   │   │
│  │         ▲                           ▲                    │   │   │
│  │         │                           │                    │   │   │
│  │    Individual's                Third Party's             │   │   │
│  │    Signature                   Signature                 │   │   │
│  └──────────────────────────────────────────────────────────┘   │   │
│                                                                 │   │
│  ┌──────────────────────────────────────────────────────────┐   │   │
│  │              MARKETPLACE / EXTERNAL INTERFACE             │   │   │
│  │                                                          │   │   │
│  │  Dual-signed consent required for:                       │   │   │
│  │    • Marketplace listings                                │   │   │
│  │    • Training consent grants                             │   │   │
│  │    • Data sharing with other parties                     │   │   │
│  │    • Sovereignty detection reporting                     │   │   │
│  │                                                          │   │   │
│  └──────────────────────────────────────────────────────────┘   │   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 2: Ontology of Shared Data — The Classification Framework

### 2.1 What Makes Data "Shared-Sovereignty"?

Not every mention of a company name makes data shared-sovereignty. The system must distinguish between:

**Personal context with incidental reference** — *"I work at Acme and I'm learning Rust"* — The fact of employment is personal. Learning Rust is personal. Acme has no meaningful interest in this data.

**Personal intellectual labor applied to third-party substance** — *"Here's my approach to optimizing Acme's supply chain algorithm"* — The *approach* is the individual's cognitive contribution. The *supply chain algorithm* is Acme's proprietary substance. The two are entangled.

**Third-party substance processed through the individual** — *"Here is Acme's proprietary database schema, help me write queries for it"* — The schema is Acme's. The individual is a conduit. Strong third-party interest.

### 2.2 The Designation Tier System

Data in the VIVIM vault is classified into one of five designation tiers. The tier determines *whether* shared-sovereignty applies and *what scope of veto* the third party holds.

```
TIER 0: PERSONAL
────────────────────────────────────────────────────────
Interest holder:    Individual only
Third-party veto:   None
Access control:     Individual's sole discretion
Examples:
  • Personal opinions, reflections, creative work
  • General professional skills development  
  • Discussion of publicly available information
  • Personal use of generally available tools/techniques
  
Governance:         Standard VIVIM individual sovereignty
────────────────────────────────────────────────────────

TIER 1: CONTEXTUAL REFERENCE
────────────────────────────────────────────────────────
Interest holder:    Individual (primary), Third party (notification only)
Third-party veto:   None, but third party is NOTIFIED if data 
                    is shared externally
Access control:     Individual's discretion with notification
Examples:
  • Mentioning employer/client name in passing
  • Discussing publicly known facts about the organization
  • Describing general (non-proprietary) work processes
  • Referencing the existence of a project without details

Governance:         Individual controls. Third party receives
                    audit log of external sharing events.
                    No veto power.
────────────────────────────────────────────────────────

TIER 2: ENTANGLED CONTRIBUTION
────────────────────────────────────────────────────────
Interest holder:    Individual (50%) + Third party (50%)
Third-party veto:   FULL MUTUAL VETO on all external operations
Access control:     Dual-signature required for external use
Examples:
  • Individual's analysis/insights applied to proprietary data
  • Problem-solving approaches for proprietary challenges
  • Strategic reasoning about confidential business situations  
  • Creative solutions built on proprietary context
  • Derivative works mixing personal IP with organizational IP

Governance:         50/50 shared sovereignty. Either party 
                    can veto any external use. Revenue from
                    marketplace split per contract terms.
                    This is the DEFAULT tier for shared data.
────────────────────────────────────────────────────────

TIER 3: CUSTODIAL
────────────────────────────────────────────────────────
Interest holder:    Third party (primary), Individual (custodial)
Third-party veto:   FULL VETO + affirmative third-party consent 
                    required to INITIATE any external operation
                    (individual cannot even propose marketplace 
                    listing without third-party pre-approval)
Access control:     Individual retains READ access (Axiom A2).
                    All other operations require third-party 
                    initiation or pre-approval.
Examples:
  • Verbatim proprietary source code
  • Client's confidential business data
  • Patient health information (within permitted use context)
  • Classified technical specifications
  • Third-party trade secrets reproduced in conversation

Governance:         Third party leads. Individual retains
                    permanent read access and right to 
                    reference for personal skill development.
                    Cannot share, sell, or consent to training.
────────────────────────────────────────────────────────

TIER 4: REGULATED
────────────────────────────────────────────────────────
Interest holder:    Third party + Regulatory body
Third-party veto:   FULL VETO + regulatory compliance engine
Access control:     Governed by external regulatory framework
                    (HIPAA, GDPR, ITAR, SOX, etc.) in addition
                    to third-party veto
Examples:
  • Protected health information
  • Financial data subject to SOX/SEC regulations  
  • Export-controlled technical data
  • Data subject to legal hold
  • PII of third parties processed in conversation

Governance:         Most restrictive tier. Automated compliance
                    checking. May require automated redaction
                    before even personal review in some 
                    jurisdictions. Audit trail required by law.
────────────────────────────────────────────────────────
```

### 2.3 Tier Determination Rules

Tier assignment is governed by three inputs, combined through a deterministic policy engine:

```
┌─────────────────────────────────────────────┐
│           TIER DETERMINATION LOGIC          │
│                                             │
│  Input 1: RELATIONSHIP CONTRACT             │
│    Pre-agreed policies that define what      │
│    categories of information fall into       │
│    which tiers for this specific             │
│    individual-organization relationship.     │
│                                             │
│  Input 2: REAL-TIME CLASSIFICATION          │
│    NLP/semantic engine that analyzes each    │
│    ACU against the contract's category       │
│    definitions and assigns a provisional     │
│    tier.                                     │
│                                             │
│  Input 3: EXPLICIT DECLARATION              │
│    Either party can manually designate or    │
│    challenge a tier assignment, triggering   │
│    the dispute resolution process.           │
│                                             │
│  Resolution:                                │
│    Final tier = max(Contract, Classifier,    │
│                     Declaration)             │
│                                             │
│    When in doubt, the HIGHER (more           │
│    restrictive) tier applies.               │
│    This protects both parties.              │
│    Either party can appeal downward.         │
└─────────────────────────────────────────────┘
```

**The "max" rule is critical.** If the contract says Tier 2 but the classifier detects verbatim proprietary code (suggesting Tier 3), the data is treated as Tier 3 until resolved. If the individual self-declares Tier 0 but the contract's category definitions clearly indicate Tier 2, Tier 2 prevails. Over-classification is an inconvenience. Under-classification is a liability.

---

## Chapter 3: Relationship Registration — The On-Chain Foundation

### 3.1 The Shared Sovereignty Contract (SSC)

Before any data is generated, the individual and the third party must establish a **Shared Sovereignty Contract (SSC)**. This is the foundational agreement that defines the rules of engagement.

The SSC is:
- **Bilateral**: Requires signatures from both the individual's DID and the third party's organizational DID
- **On-chain**: Immutable once activated, amendable only by bilateral agreement
- **Temporal**: Has an activation date, a term, and expiration conditions
- **Specific**: Defines exact categories and classification policies — not vague principles

### 3.2 SSC Structure

```
SHARED SOVEREIGNTY CONTRACT SCHEMA

contract_id:        Unique on-chain identifier
version:            Schema version (for forward compatibility)
created_at:         Timestamp
activated_at:       Timestamp (may differ from created_at if 
                    approval workflow required)

═══════════════════════════════════════════════════════
SECTION 1: PARTIES
═══════════════════════════════════════════════════════

individual:
  did:              did:vivim:<individual_hash>
  role:             "employee" | "contractor" | "consultant" | 
                    "researcher" | "collaborator" | "licensee"
  signature:        Ed25519 signature over contract hash

organization:
  did:              did:vivim:org:<org_hash>
  legal_name:       String
  jurisdiction:     ISO country code(s)
  authorized_signer:
    did:            did:vivim:<signer_hash>
    role:           "Legal" | "CISO" | "DPO" | "HR" | "CEO"
    signature:      Ed25519 signature over contract hash

═══════════════════════════════════════════════════════
SECTION 2: SCOPE
═══════════════════════════════════════════════════════

relationship_type:  "employment" | "contract" | "consulting" | 
                    "research" | "collaboration" | "license"

covered_domains:    
  // What subject areas fall under this contract
  // Defined with enough specificity to enable classification
  [
    {
      domain_id:       "eng-backend-systems",
      description:     "Backend systems architecture, APIs, 
                        database design, infrastructure",
      keywords:        ["microservices", "API gateway", ...],
      semantic_anchor: Embedding vector for classifier,
      tier_default:    2
    },
    {
      domain_id:       "customer-data",
      description:     "Any data containing or derived from 
                        customer records, usage patterns, PII",
      keywords:        ["customer", "user data", "analytics", ...],
      semantic_anchor: Embedding vector,
      tier_default:    3,
      regulatory:      ["GDPR", "CCPA"]  // triggers Tier 4 overlay
    },
    ...
  ]

excluded_domains:
  // Explicitly carved out — never subject to shared sovereignty
  [
    {
      domain_id:       "personal-development",
      description:     "Individual's general skill development, 
                        learning, career growth not tied to 
                        proprietary projects",
      tier_override:   0  // always Tier 0 regardless of context
    },
    ...
  ]

═══════════════════════════════════════════════════════
SECTION 3: CLASSIFICATION POLICY
═══════════════════════════════════════════════════════

classifier_config:
  // Parameters for the real-time classification engine
  
  model:             "vivim-classifier-v3"  // versioned classifier
  confidence_threshold: 0.75  // below this, flag for manual review
  
  tier_escalation_rules:
    // Rules that automatically escalate tier regardless of 
    // classifier output
    [
      {
        trigger:     "verbatim_code_match",
        description: "Exact match with organization's codebase 
                      (matched against provided code fingerprints)",
        escalate_to: 3
      },
      {
        trigger:     "named_entity_match",
        description: "Mentions of internal project codenames, 
                      unreleased product names, internal personnel",
        entity_list: "provided separately, updatable by org",
        escalate_to: 2
      },
      {
        trigger:     "regulatory_keyword",
        description: "Presence of PII, PHI, financial data indicators",
        escalate_to: 4
      }
    ]
  
  tier_de_escalation_rules:
    // Rules that prevent over-classification
    [
      {
        trigger:     "public_information",
        description: "Information verifiably in the public domain 
                      (published documentation, press releases, 
                      open-source code)",
        de_escalate_to: 0
      },
      {
        trigger:     "general_skill",
        description: "Discussion of general programming languages, 
                      frameworks, algorithms not specific to org's 
                      proprietary implementation",
        de_escalate_to: 0
      }
    ]

  organization_provided_signals:
    // The organization can provide artifacts to improve classification
    code_fingerprints:    Optional<Hash[]>   // hashes of proprietary code
    project_codenames:    Optional<String[]>  // internal project names
    entity_dictionary:    Optional<NER_Dict>  // custom NER for org entities
    topic_embeddings:     Optional<Vec[]>     // embeddings of proprietary topics
    
    // IMPORTANT: The organization provides SIGNALS for classification,
    // NOT access to the vault contents. The classification engine 
    // runs LOCALLY in the individual's VIVIM client.

═══════════════════════════════════════════════════════
SECTION 4: ACCESS CONTROL RULES
═══════════════════════════════════════════════════════

// What each party can do with data at each tier

tier_2_rules:  // ENTANGLED CONTRIBUTION (50/50)
  individual_can:
    - read                       // always (Axiom A2)
    - annotate                   // personal notes/tags
    - reference_in_new_work      // use insights in future conversations
    - request_external_share     // propose sharing — requires org co-sign
    - request_marketplace_list   // propose sale — requires org co-sign
    - request_training_consent   // propose training use — requires org co-sign
    
  individual_cannot:
    - unilaterally_share         // blocked without org co-signature
    - unilaterally_sell          // blocked without org co-signature
    - unilaterally_consent_to_training  // blocked
    - delete_without_notice      // org must be notified of deletion
    - reclassify_downward        // cannot unilaterally move to Tier 0/1
    
  organization_can:
    - read_metadata              // tier, timestamp, topic, size — NOT content
    - request_content_review     // propose reviewing specific ACUs — requires 
                                 // individual co-sign to view content
    - co_sign_external_share     // approve individual's sharing request
    - co_sign_marketplace_list   // approve individual's sale request
    - co_sign_training_consent   // approve training consent
    - request_tier_escalation    // propose moving data to higher tier
    - veto_any_external_use      // unilateral veto right
    
  organization_cannot:
    - access_content_unilaterally     // cannot read without individual's consent
    - copy_data_from_vault            // data never leaves individual's vault
    - delete_from_individual_vault    // cannot force deletion (Axiom A2)
    - reclassify_downward_without_individual  // bilateral only
    - transfer_their_interest_without_individual  // cannot sell their 
                                                   // veto right to a 4th party

tier_3_rules:  // CUSTODIAL — org-primary
  // As tier_2, except:
  individual_cannot:
    - request_external_share     // org must INITIATE (not just approve)
    - request_marketplace_list   // org must initiate
    - request_training_consent   // org must initiate
    
  organization_can:
    - initiate_external_share    // org can propose sharing — individual 
                                 // retains veto
    - initiate_marketplace_list  // org can propose sale — individual 
                                 // retains veto
    - request_deletion           // can request individual delete specific 
                                 // ACUs (individual can refuse, but 
                                 // refusal is logged)

═══════════════════════════════════════════════════════
SECTION 5: FINANCIAL TERMS
═══════════════════════════════════════════════════════

marketplace_revenue_split:
  tier_2:
    individual_share:  0.50      // 50%
    organization_share: 0.50     // 50%
    // Adjustable by mutual agreement. Must sum to 1.0.
    // VIVIM protocol fee deducted before split.
    
  tier_3:
    individual_share:  0.20      // 20% (individual's labor contribution)
    organization_share: 0.80     // 80% (org's proprietary substance)
    // These are defaults. Contract can specify different splits.

training_consent_revenue:
  // When an AI company pays for training consent
  split_same_as_marketplace: true  // or specify separately

detection_damages:
  // When detection algorithms find unauthorized use of shared data
  split:               "per_marketplace_terms"
  pursuit_rights:      "either_party_can_initiate"
  // Either the individual OR the org can initiate a claim
  // Revenue from damages/settlements split per contract terms

═══════════════════════════════════════════════════════
SECTION 6: TEMPORAL PROVISIONS
═══════════════════════════════════════════════════════

contract_term:
  start:               Date
  end:                 Date | "relationship_end + sunset_period"

sunset_provisions:
  // What happens to shared-sovereignty designations when the 
  // relationship ends (employee leaves, contract expires, etc.)
  
  on_relationship_end:
    tier_2_data:
      action:          "sunset"
      sunset_period:   "24 months"  // data remains shared-sovereignty 
                                    // for 24 months after relationship ends
      after_sunset:    "reclassify_to_tier_0"  // individual gains full control
      
    tier_3_data:
      action:          "sunset_with_review"
      sunset_period:   "36 months"
      review_required: true  // org can request review of specific ACUs
                            // before sunset completes
      after_sunset:    "reclassify_to_tier_1"  // individual controls but 
                                               // org retains notification right
      
    tier_4_data:
      action:          "regulatory_governs"  // sunset only when regulation allows
      minimum_period:  "per_applicable_regulation"

  early_termination:
    // If either party wants to end the SSC early
    mutual_agreement:  "immediate effect"
    unilateral_by_individual:
      notice_period:   "30 days"
      effect:          "all new data generated after notice is Tier 0"
      existing_data:   "sunset provisions apply from notice date"
    unilateral_by_organization:
      notice_period:   "30 days"  
      effect:          "same as above"
      // Neither party can "trap" the other in a contract

═══════════════════════════════════════════════════════
SECTION 7: DISPUTE RESOLUTION
═══════════════════════════════════════════════════════

classification_disputes:
  // When parties disagree on the tier assignment of an ACU
  
  process:
    1. "Disputing party files challenge with evidence"
    2. "Other party has 72 hours to respond"
    3. "If unresolved, escalate to neutral arbiter"
    4. "During dispute, higher tier applies (precautionary)"
  
  arbiter:
    type:              "VIVIM_DAO_arbitration" | "specified_third_party"
    binding:           true
    appeal:            "one appeal to higher arbiter panel"

access_disputes:
  // When one party requests access/sharing and the other vetoes
  
  veto_is_final:       true  // no override mechanism
  // BUT: the vetoing party must respond within response_window
  // Silence after response_window = deemed approval (for Tier 2 only)
  
  response_window:
    tier_2:            "7 days"
    tier_3:            "never — silence is NOT approval"
    tier_4:            "never"

═══════════════════════════════════════════════════════
SECTION 8: SIGNATURES & ACTIVATION
═══════════════════════════════════════════════════════

contract_hash:         SHA-256 of Sections 1-7
individual_signature:  Ed25519(SK_individual, contract_hash)
organization_signature: Ed25519(SK_org_signer, contract_hash)

activation_tx:         On-chain transaction recording both signatures
                       and the contract hash. The contract itself may 
                       be stored on-chain (if small) or stored 
                       off-chain with on-chain hash commitment.
```

### 3.3 SSC Lifecycle

```
CREATION ──→ NEGOTIATION ──→ SIGNING ──→ ACTIVE ──→ AMENDMENT* ──→ SUNSET ──→ EXPIRED
                                           │
                                           ├──→ DISPUTE ──→ RESOLUTION ──→ ACTIVE
                                           │
                                           └──→ TERMINATION ──→ SUNSET ──→ EXPIRED

* Amendment requires new bilateral signatures and creates a new 
  on-chain version. Previous version remains on-chain for audit trail.
```

### 3.4 Multiple Concurrent SSCs

An individual may have multiple active SSCs simultaneously (employer + client + research institution + collaboration). Data may be subject to *multiple* third-party interests.

**Resolution rule for overlapping interests:**

When a single ACU falls under multiple SSCs:

1. All applicable third parties are designated as interest holders
2. **All** parties must co-sign for external use (unanimous consent, not majority)
3. Revenue splits are proportional: each party's share is reduced proportionally to maintain the individual's base share
4. The most restrictive tier across all applicable SSCs governs
5. Sunset requires the *longest* applicable sunset period to expire

This is deliberately conservative. The individual and any *single* third party can unilaterally block external use. This prevents complex multi-party disputes at the cost of making some shared data effectively unmovable externally — which is the safer default.

---

## Chapter 4: The Classification Engine

### 4.1 Architecture Overview

The classification engine runs **locally** within the individual's VIVIM client. The third party never sees the raw data during classification. The third party provides *classification signals* (keyword lists, code fingerprints, topic embeddings) but does not process the data itself.

```
┌──────────────────────────────────────────────────────────────┐
│                INDIVIDUAL'S VIVIM CLIENT (LOCAL)              │
│                                                              │
│  ┌─────────────┐    ┌──────────────────────────────────┐     │
│  │   RAW ACU    │───→│      CLASSIFICATION PIPELINE      │     │
│  │  (new data)  │    │                                  │     │
│  └─────────────┘    │  ┌────────────────────────────┐  │     │
│                      │  │  Stage 1: ENTITY DETECTION  │  │     │
│                      │  │  Named entities, project     │  │     │
│                      │  │  codenames, internal terms   │  │     │
│                      │  │  (matched against org's      │  │     │
│                      │  │   entity dictionary)         │  │     │
│                      │  └─────────────┬──────────────┘  │     │
│                      │                ▼                  │     │
│                      │  ┌────────────────────────────┐  │     │
│                      │  │  Stage 2: SEMANTIC MATCHING │  │     │
│                      │  │  Embed ACU content and      │  │     │
│                      │  │  compare against org's      │  │     │
│                      │  │  covered domain embeddings  │  │     │
│                      │  └─────────────┬──────────────┘  │     │
│                      │                ▼                  │     │
│                      │  ┌────────────────────────────┐  │     │
│                      │  │  Stage 3: CODE FINGERPRINT │  │     │
│                      │  │  Hash-based matching of     │  │     │
│                      │  │  code snippets against      │  │     │
│                      │  │  org's codebase fingerprints│  │     │
│                      │  └─────────────┬──────────────┘  │     │
│                      │                ▼                  │     │
│                      │  ┌────────────────────────────┐  │     │
│                      │  │  Stage 4: POLICY ENGINE     │  │     │
│                      │  │  Apply escalation and       │  │     │
│                      │  │  de-escalation rules from   │  │     │
│                      │  │  SSC Section 3              │  │     │
│                      │  └─────────────┬──────────────┘  │     │
│                      │                ▼                  │     │
│                      │  ┌────────────────────────────┐  │     │
│                      │  │  Stage 5: TIER ASSIGNMENT   │  │     │
│                      │  │  Final tier + confidence    │  │     │
│                      │  │  If confidence < threshold, │  │     │
│                      │  │  flag for manual review     │  │     │
│                      │  └────────────────────────────┘  │     │
│                      └──────────────────────────────────┘     │
│                                                              │
│  OUTPUT: ACU with tier designation, confidence score,        │
│          classification rationale (human-readable),          │
│          matched signals (which rules/entities triggered)    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  ON-CHAIN: Log classification decision hash           │    │
│  │  (tier + ACU_hash + timestamp + confidence)           │    │
│  │  Content NOT logged — only the decision metadata      │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Classification Pipeline Detail

```
CLASSIFICATION ENGINE: Per-ACU Processing

INPUT:
  acu         : New Atomic Content Unit
  ssc_set     : All active SSCs for this individual
  
OUTPUT:
  designation : {
    tier:              0 | 1 | 2 | 3 | 4,
    confidence:        Float in [0, 1],
    applicable_sscs:   List of SSC IDs,
    matched_signals:   List of signals that triggered classification,
    rationale:         Human-readable explanation,
    review_required:   Boolean
  }

PROCEDURE:

  content ← PlainText(acu)
  embedding ← Embed(content)
  
  candidate_designations ← []
  
  FOR each ssc in ssc_set:
    
    signals_matched ← []
    tier_votes ← []
    
    // ── Stage 1: Entity Detection ──
    entities ← NER(content, custom_dict=ssc.entity_dictionary)
    
    FOR each entity e in entities:
      IF e.type == "internal_project":
        signals_matched.append(("project_codename", e.text, e.span))
        tier_votes.append(ssc.escalation_rules.named_entity_match.escalate_to)
      
      IF e.type == "internal_person" AND context_is_confidential(e):
        signals_matched.append(("internal_personnel", e.text, e.span))
        tier_votes.append(2)
      
      IF e.type == "customer_name" OR e.type == "PII":
        signals_matched.append(("pii_detected", e.text, e.span))
        tier_votes.append(4)
    
    // ── Stage 2: Semantic Domain Matching ──
    FOR each domain d in ssc.covered_domains:
      similarity ← CosineSim(embedding, d.semantic_anchor)
      
      IF similarity > ssc.classifier_config.confidence_threshold:
        signals_matched.append(("domain_match", d.domain_id, similarity))
        tier_votes.append(d.tier_default)
    
    // Also check EXCLUDED domains
    FOR each excl in ssc.excluded_domains:
      similarity ← CosineSim(embedding, excl.semantic_anchor)
      
      IF similarity > ssc.classifier_config.confidence_threshold:
        // This domain is explicitly excluded — de-escalate
        tier_votes.append(excl.tier_override)
        signals_matched.append(("exclusion_match", excl.domain_id, similarity))
    
    // ── Stage 3: Code Fingerprint Matching ──
    IF ContainsCode(content):
      code_blocks ← ExtractCodeBlocks(content)
      FOR each block in code_blocks:
        fingerprint ← MinHash(block)  // locality-sensitive hash
        match ← NearestNeighbor(fingerprint, ssc.code_fingerprints)
        
        IF match.similarity > 0.7:
          signals_matched.append(("code_match", match.id, match.similarity))
          tier_votes.append(3)  // verbatim code → custodial
    
    // ── Stage 4: Regulatory Keyword Detection ──
    FOR each rule in ssc.escalation_rules:
      IF rule.trigger == "regulatory_keyword":
        IF RegexMatch(content, rule.patterns):
          signals_matched.append(("regulatory", rule.description))
          tier_votes.append(4)
    
    // ── Stage 5: Public Information De-escalation ──
    // Check if the content is discussing publicly available information
    public_score ← PublicAvailabilityScore(content)
    IF public_score > 0.9:
      tier_votes.append(0)
      signals_matched.append(("public_info", public_score))
    
    // ── Stage 6: Aggregate Tier Decision ──
    IF |tier_votes| == 0:
      // No signals matched any SSC domain → Tier 0
      final_tier ← 0
      confidence ← 0.95
    ELSE:
      // Conservative: take the MAXIMUM tier vote
      final_tier ← max(tier_votes)
      
      // Confidence is based on signal strength and agreement
      agreement ← |{v : v == final_tier}| / |tier_votes|
      max_signal_strength ← max(s.strength for s in signals_matched 
                                if hasattr(s, 'strength'))
      confidence ← agreement × max_signal_strength
    
    IF |signals_matched| > 0:
      candidate_designations.append({
        ssc:             ssc.contract_id,
        tier:            final_tier,
        confidence:      confidence,
        signals:         signals_matched,
        tier_votes:      tier_votes
      })
  
  // ── Final Designation ──
  IF |candidate_designations| == 0:
    // No SSC applies → purely personal
    designation ← {tier: 0, confidence: 0.99, applicable_sscs: [],
                   matched_signals: [], rationale: "No SSC signals matched.",
                   review_required: FALSE}
  ELSE:
    // Multiple SSCs may apply — take the most restrictive
    max_tier ← max(cd.tier for cd in candidate_designations)
    min_confidence ← min(cd.confidence for cd in candidate_designations 
                         where cd.tier == max_tier)
    
    designation ← {
      tier:            max_tier,
      confidence:      min_confidence,
      applicable_sscs: [cd.ssc for cd in candidate_designations where cd.tier > 0],
      matched_signals: UnionAll(cd.signals for cd in candidate_designations),
      rationale:       GenerateRationale(candidate_designations),
      review_required: (min_confidence < threshold) OR (max_tier >= 3)
    }
  
  // ── Log Decision (metadata only, not content) ──
  LogOnChain({
    acu_hash:        Hash(acu),
    tier:            designation.tier,
    confidence:      designation.confidence,
    ssc_ids:         designation.applicable_sscs,
    timestamp:       now(),
    review_required: designation.review_required
  })
  
  RETURN designation
```

### 4.3 Classification Accuracy & Error Handling

| Error Type | Consequence | Mitigation |
|-----------|-------------|------------|
| **False Positive** (personal data classified as shared) | Individual cannot share/sell data without unnecessary org approval | Individual can challenge. Low-cost dispute process. Over-classification is inconvenient but not harmful. |
| **False Negative** (shared data classified as personal) | Individual could unilaterally share org's proprietary data | Conservative "max tier" rule. Org can retroactively designate. Post-hoc detection via org's monitoring dashboard. |
| **Tier Inflation** (Tier 2 data classified as Tier 3) | Individual loses initiation rights they should have | Either party can challenge. Tier inflation is less harmful than tier deflation. |
| **Tier Deflation** (Tier 3 data classified as Tier 2) | Individual gains initiation rights they shouldn't have | Org's escalation rules should catch this. Org monitors classification decisions via metadata dashboard. |

**Error rate targets:**
- False negative rate (missing shared-sovereignty): < 2% on covered-domain data
- False positive rate (over-classifying personal data): < 10% (tolerable because challenge process is low-cost)
- Tier accuracy (correct tier given shared-sovereignty): > 85%

### 4.4 Retroactive Designation

The third party can retroactively designate data that was initially classified as Tier 0.

**Constraints on retroactive designation:**
1. Must be filed within the contract's retroactive designation window (default: 30 days from ACU creation)
2. Must provide justification referencing specific SSC domains/categories
3. Individual is notified immediately and can challenge
4. During challenge period, the data is treated at the proposed tier (precautionary)
5. No more than 5% of an individual's total ACUs can be retroactively designated per quarter (prevents abuse)

---

## Chapter 5: The Dual-Key Access Control Engine

### 5.1 Cryptographic Architecture

The access control system must enforce the mutual veto property cryptographically — not just through policy. The individual should be unable to share Tier 2+ data externally even if they bypass the VIVIM client, because the data artifacts themselves carry the dual-key requirement.

```
DUAL-KEY CRYPTOGRAPHIC ARCHITECTURE

═══════════════════════════════════════════════════════
VAULT STORAGE (Per-ACU Encryption)
═══════════════════════════════════════════════════════

For Tier 0 (personal) data:
  Standard encryption:
  
  ACU_encrypted = Encrypt(ACU_plaintext, K_user)
  
  K_user is derived from the individual's master key.
  Individual has full, sole control.

For Tier 1 (contextual reference) data:
  Standard encryption + notification commitment:
  
  ACU_encrypted = Encrypt(ACU_plaintext, K_user)
  notification_commitment = Hash(ACU_id || tier || timestamp)
  
  Stored on-chain: notification_commitment
  Individual has full control. Org can verify notification 
  commitments against their metadata dashboard.

For Tier 2-4 (shared-sovereignty) data:
  Dual-layer encryption:
  
  // Layer 1: Content encryption (individual can always read)
  ACU_encrypted_L1 = Encrypt(ACU_plaintext, K_user)
  
  // Layer 2: Export authorization token
  // This token is required for ANY external operation
  // and can only be created with BOTH parties' signatures
  
  ACU_export_token = NULL  // does not exist until both parties agree
  
  // To create an export token (required for sharing/selling/training):
  export_request = {
    acu_id:         ACU_id,
    operation:      "share" | "sell" | "train_consent",
    recipient:      DID of receiving party,
    terms:          specific terms of this export,
    expiration:     when this authorization expires,
    nonce:          random nonce for replay protection
  }
  
  individual_sig = Sign(export_request, SK_individual)
  org_sig        = Sign(export_request, SK_org)
  
  ACU_export_token = {
    request:        export_request,
    individual_sig: individual_sig,
    org_sig:        org_sig,
    created_at:     timestamp
  }
  
  // The export token is verified by any receiving system
  // (marketplace, AI training pipeline, data buyer)
  // before accepting the data.
  
  // WITHOUT a valid export token containing BOTH signatures,
  // the receiving system MUST reject the data.

═══════════════════════════════════════════════════════
RECEIVING SYSTEM VERIFICATION
═══════════════════════════════════════════════════════

When a VIVIM-compliant system receives data:

1. Check: Does the ACU have a tier designation?
2. If tier >= 2:
   a. Check: Is a valid export_token present?
   b. Verify individual_sig against individual's DID public key
   c. Verify org_sig against org's DID public key
   d. Check: Is the operation type correct?
   e. Check: Is the recipient DID correct (matches this system)?
   f. Check: Has the export_token expired?
   g. Check: Is the export_token recorded on-chain? (prevents forgery)
   
   If ANY check fails → REJECT the data
   
3. If tier < 2:
   Accept with standard individual-only signature verification
```

### 5.2 The Consent Flow (Tier 2 Example)

```
CONSENT FLOW: Individual wants to sell Tier 2 data on marketplace

Timeline:
────────────────────────────────────────────────────────────────

t₁  INDIVIDUAL initiates request:
    "I want to list ACUs [acu_1, acu_2, acu_3] on the marketplace
     at price $X per ACU, with training consent included."
    
    System generates: export_request for each ACU
    Individual signs: individual_sig for each
    
    Status: PENDING_ORG_APPROVAL

t₂  ORGANIZATION receives notification:
    Dashboard shows: "Employee [name] requests marketplace listing
    of 3 ACUs from domain [eng-backend-systems]."
    
    Org can:
    a) VIEW METADATA: tier, domain, timestamp, size, topic summary
       (NOT the content — content requires separate bilateral consent)
    b) APPROVE: Sign the export_request → creates valid export_token
    c) REJECT: File veto → no export_token created → request denied
    d) REQUEST REVIEW: Ask to see content before deciding
       → Sends content_review_request to individual
       → Individual can approve content review or withdraw listing request
    e) NO RESPONSE: After response_window (7 days for Tier 2), 
       deemed approved. Export_token auto-generated.

t₃  IF APPROVED:
    export_tokens created and recorded on-chain
    ACUs listed on marketplace with dual-signed authorization
    Marketplace verifies both signatures before listing goes live
    
    IF SOLD:
    Revenue split per SSC terms (default 50/50 for Tier 2)
    Buyer receives: ACU data + export_token (proof of authorization)
    On-chain record: sale_tx with ACU hashes, buyer DID, price, split

t₃' IF REJECTED:
    Individual is notified: "Organization vetoed listing. No justification required."
    ACUs remain in vault, Tier 2 designation unchanged.
    Individual can:
    a) Accept the veto (no action)
    b) Challenge the tier classification (maybe this should be Tier 0?)
    c) Request dispute resolution per SSC Section 7
    
    // Note: The individual CANNOT circumvent the veto.
    // The marketplace will not accept data without a valid export_token.
    // Even if the individual extracts the plaintext and tries to sell 
    // it outside the VIVIM ecosystem, any VIVIM-compliant buyer 
    // will reject unverified data, and the on-chain record shows 
    // the veto, creating legal exposure for unauthorized sharing.
```

### 5.3 Org Content Access (Bilateral)

A critical subtlety: the organization has a 50% ownership interest but **cannot read the content unilaterally**. The organization sees only metadata. To view actual content (for review, audit, or dispute), the organization must request access, and the individual must approve.

```
ORG CONTENT ACCESS FLOW

═══════════════════════════════════════════════════════
WHY THIS DESIGN?
═══════════════════════════════════════════════════════

The organization's interest is in CONTROLLING EXTERNAL USE,
not in SURVEILLING THE INDIVIDUAL.

The organization cares about:
  ✓ Preventing trade secrets from being sold/shared
  ✓ Preventing proprietary data from entering AI training
  ✓ Maintaining competitive advantage
  ✓ Regulatory compliance

The organization does NOT need:
  ✗ To read every conversation an employee has with AI
  ✗ To monitor how employees think through problems
  ✗ To surveil cognitive processes in real-time

The metadata dashboard gives the org everything it needs 
for governance without becoming a surveillance tool.

═══════════════════════════════════════════════════════
WHEN ORG CAN REQUEST CONTENT ACCESS
═══════════════════════════════════════════════════════

1. MARKETPLACE REVIEW: Org wants to review content before 
   approving a marketplace listing. Reasonable — they need 
   to assess what's being sold.

2. TIER DISPUTE: Org believes data is under-classified and 
   wants to review content to support escalation. Must cite 
   specific metadata signals (e.g., "this ACU was classified 
   Tier 1 but matches our Project Atlas codename").

3. INCIDENT RESPONSE: A data breach or unauthorized disclosure 
   has occurred, and org needs to assess what was exposed.
   Requires documentation of the incident.

4. REGULATORY AUDIT: External regulatory requirement mandates 
   content review. Must provide regulatory citation.

5. OFFBOARDING REVIEW: Employee is leaving, org wants to 
   review Tier 3+ data before sunset period begins.

═══════════════════════════════════════════════════════
FLOW
═══════════════════════════════════════════════════════

Org files: content_access_request
  - Specifies: which ACU(s)
  - Reason:    one of the above categories
  - Duration:  how long access is needed
  - Scope:     view-only | view-and-annotate | view-and-export

Individual receives notification.

Individual can:
  APPROVE  → Temporary decryption key shared via secure channel
             Key expires after specified duration
             All access is logged on-chain
             
  PARTIAL  → Individual provides redacted version
             (personal content redacted, org-relevant content visible)
             
  REFUSE   → Access denied. Refusal logged. Org can escalate 
             to dispute resolution per SSC Section 7.
             
  Note: For Tier 4 (regulated) data, regulatory authority 
  may override individual's refusal via legal process.
  VIVIM protocol complies with valid legal orders.
```

---

## Chapter 6: Vault Architecture for Shared Sovereignty

### 6.1 Per-ACU Metadata Schema Extension

Every ACU in the individual's vault gains additional fields for shared-sovereignty:

```
ACU SCHEMA (Extended for Shared Sovereignty)

═══════════════════════════════════════════════════════
STANDARD VIVIM FIELDS (unchanged)
═══════════════════════════════════════════════════════
acu_id:              Unique identifier
content_encrypted:   AES-256-GCM encrypted content
content_hash:        SHA-256 of plaintext content
provider:            Which AI provider generated this
created_at:          Timestamp
user_did:            Individual's DID
user_signature:      Individual's signature over content_hash

═══════════════════════════════════════════════════════
SHARED SOVEREIGNTY FIELDS (new)
═══════════════════════════════════════════════════════
sovereignty:
  tier:              0 | 1 | 2 | 3 | 4
  classification:
    method:          "auto" | "manual" | "retroactive"
    confidence:      Float in [0, 1]
    signals_matched: List of signal identifiers
    rationale:       Human-readable explanation
    timestamp:       When classification was made
    challenged:      Boolean
    challenge_status: NULL | "pending" | "upheld" | "overturned"
  
  applicable_sscs:   
    // List of SSCs that govern this ACU
    [
      {
        ssc_id:      Contract ID
        org_did:     Organization's DID
        org_name:    Organization's display name
        tier:        Tier assigned under THIS SSC
        role:        "equal" (Tier 2) | "primary" (Tier 3) | 
                     "regulatory" (Tier 4)
      }
    ]
  
  export_authorizations:
    // History of export tokens created for this ACU
    [
      {
        token_id:    Export token ID
        operation:   "share" | "sell" | "train_consent"
        recipient:   Recipient DID
        individual_sig: Signature
        org_sigs:    {ssc_id: signature, ...}  // one per applicable SSC
        created_at:  Timestamp
        expires_at:  Timestamp
        status:      "active" | "expired" | "revoked"
        on_chain_tx: Transaction ID
      }
    ]
  
  access_log:
    // Every access to this ACU is logged
    [
      {
        accessor:    DID
        access_type: "read" | "export" | "review"
        timestamp:   Timestamp
        authorized_by: "individual" | "export_token" | "bilateral_consent"
      }
    ]

  lifecycle:
    relationship_active: Boolean
    sunset_start:        NULL | Timestamp
    sunset_end:          NULL | Timestamp  
    post_sunset_tier:    NULL | 0 | 1
```

### 6.2 Vault Partitioning

The vault is logically (not necessarily physically) partitioned:

```
INDIVIDUAL'S VIVIM VAULT
│
├── /personal/                    ← Tier 0 data (full sovereignty)
│   ├── acu_001.enc
│   ├── acu_002.enc
│   └── ...
│
├── /contextual/                  ← Tier 1 data (notification only)
│   ├── acu_101.enc
│   └── ...
│
├── /shared/                      ← Tier 2-4 data
│   ├── /ssc_<contract_id_1>/     ← Data under SSC with Employer
│   │   ├── tier_2/
│   │   │   ├── acu_201.enc
│   │   │   └── ...
│   │   ├── tier_3/
│   │   │   ├── acu_301.enc
│   │   │   └── ...
│   │   └── tier_4/
│   │       └── ...
│   │
│   ├── /ssc_<contract_id_2>/     ← Data under SSC with Client
│   │   └── ...
│   │
│   └── /multi/                   ← Data under multiple SSCs
│       ├── acu_501.enc           ← Requires ALL orgs to co-sign
│       └── ...
│
├── /pending_classification/      ← Awaiting tier determination
│   └── ...                       ← Treated as max(applicable tiers)
│                                   until classified
│
└── /disputed/                    ← Under active tier dispute
    └── ...                       ← Treated at proposed (higher) tier
                                    until resolved
```

### 6.3 Encryption Key Hierarchy

```
MASTER KEY (derived from individual's identity)
│
├── K_personal        → encrypts Tier 0 data
│                      Individual has sole access
│
├── K_shared_read     → encrypts Tier 1-4 data (read layer)
│                      Individual has sole access
│                      (Axiom A2: individual can always read)
│
└── K_export_master   → used to derive per-export-token keys
                       Never used directly
    │
    ├── K_export_1    → derived for specific export authorization
    │                  Created only when export_token exists
    │                  (requires both signatures)
    │
    └── K_export_N    → ...

IMPORTANT:
  The organization NEVER holds K_shared_read.
  The organization cannot read vault contents.
  
  The organization's role is GATING, not ACCESSING:
  they hold a signing key that gates the creation of 
  export_tokens, which gate external data movement.
  
  The data itself is always encrypted under the 
  individual's keys. The organization's key is an 
  AUTHORIZATION key, not a DECRYPTION key.
```

---

## Chapter 7: Organization Dashboard & Interface

### 7.1 What the Organization Sees

The organization has a dashboard — a VIVIM-compliant interface that shows them metadata about shared-sovereignty data across all their employees/contractors, without revealing content.

```
ORGANIZATION DASHBOARD

═══════════════════════════════════════════════════════
AGGREGATE VIEW
═══════════════════════════════════════════════════════

Organization: Acme Corp
Active SSCs:  247 (employees) + 38 (contractors) + 12 (consultants)
Total shared-sovereignty ACUs: 1,247,893

By Tier:
  Tier 1 (contextual):     812,445  (65.1%)
  Tier 2 (entangled):      387,234  (31.0%)
  Tier 3 (custodial):       44,891   (3.6%)
  Tier 4 (regulated):        3,323   (0.3%)

Pending Actions:
  ⏳ 14 export requests awaiting approval
  ⚠️  3 tier disputes in progress
  🔴  1 detection alert (possible unauthorized training)

═══════════════════════════════════════════════════════
PER-INDIVIDUAL VIEW (selected employee)
═══════════════════════════════════════════════════════

Individual: [Name redacted — shown as DID]
SSC:        ssc:acme:emp:2024-0847
Role:       Senior Engineer
Active since: 2024-03-15
Shared-sovereignty ACUs: 4,823

Breakdown by domain:
  eng-backend-systems:     2,891 ACUs (Tier 2)
  customer-data:              47 ACUs (Tier 4)
  product-strategy:          312 ACUs (Tier 2)
  internal-tools:          1,573 ACUs (Tier 2)

Recent activity:
  Last 7 days: 34 new shared-sovereignty ACUs created
  Classification confidence: 89% avg (3 flagged for review)

Pending requests from this individual:
  📋 Request to list 5 ACUs on marketplace (domain: internal-tools)
     Submitted: 2 days ago
     [Review] [Approve] [Reject]

═══════════════════════════════════════════════════════
DETECTION ALERTS
═══════════════════════════════════════════════════════

🔴 ALERT: Possible unauthorized training detected
   
   VIVIM detection algorithms (run by individual, 
   results shared per SSC terms) flagged:
   
   Model:     GPT-5 (OpenAI)
   Evidence:  12 Tier 2 ACUs from domain [eng-backend-systems]
              show elevated membership inference scores
   MI score:  3.7 bits (strong signal)
   
   Affected SSC individuals: 3 employees
   
   [View detection report] [Initiate joint claim] 
   [Request content review from affected individuals]

═══════════════════════════════════════════════════════
WHAT THE ORG CANNOT DO FROM THIS DASHBOARD
═══════════════════════════════════════════════════════

✗ Read content of any ACU
✗ Download or export any data
✗ Access the individual's vault directly
✗ Override a tier classification unilaterally
✗ Approve sharing without the individual's co-signature
✗ Track real-time conversation activity
✗ See which AI providers the individual uses (only that 
  shared-sovereignty ACUs were created)
```

### 7.2 Organization API

For automated governance, the organization can interact via API:

```
ORGANIZATION API ENDPOINTS

// View metadata
GET  /ssc/{ssc_id}/acus?tier={tier}&domain={domain}&date_range={range}
     Returns: List of ACU metadata (no content)

GET  /ssc/{ssc_id}/stats
     Returns: Aggregate statistics

// Consent management
GET  /ssc/{ssc_id}/pending_requests
     Returns: List of pending export/sharing requests

POST /ssc/{ssc_id}/requests/{request_id}/approve
     Body: {org_signature: ...}
     Effect: Creates export_token with org co-signature

POST /ssc/{ssc_id}/requests/{request_id}/reject
     Body: {reason: optional}
     Effect: Blocks export, notifies individual

// Classification management  
POST /ssc/{ssc_id}/designate
     Body: {acu_ids: [...], proposed_tier: N, justification: "..."}
     Effect: Retroactive designation (within contract limits)

POST /ssc/{ssc_id}/disputes/{dispute_id}/respond
     Body: {position: "...", evidence: "..."}
     
// Detection integration
GET  /ssc/{ssc_id}/detection_reports
     Returns: Detection results shared by individuals per SSC terms

POST /ssc/{ssc_id}/joint_claim
     Body: {model: "...", evidence_package: "...", individuals: [...]}
     Effect: Initiates joint sovereignty claim against unauthorized use

// Lifecycle
POST /ssc/{ssc_id}/offboard/{individual_did}
     Effect: Triggers sunset process for this individual's SSC
```

---

## Chapter 8: Marketplace Integration

### 8.1 Listing Shared-Sovereignty Data

When data is dual-owned, the marketplace must enforce dual authorization and split revenue correctly.

```
MARKETPLACE LISTING: Shared-Sovereignty Data

═══════════════════════════════════════════════════════
LISTING CREATION FLOW
═══════════════════════════════════════════════════════

Step 1: INDIVIDUAL INITIATES
  Individual selects ACUs for listing.
  System checks: which ACUs are Tier 2+?
  
  For Tier 0-1: Standard listing (individual only)
  For Tier 2:   Dual-authorization flow triggered
  For Tier 3:   Org must initiate (individual cannot)
  For Tier 4:   Cannot be listed (regulatory prohibition)

Step 2: INDIVIDUAL SIGNS LISTING PROPOSAL
  listing_proposal = {
    acu_ids:         [acu_1, acu_2, ...],
    price:           $X per ACU (or bundle price),
    terms:           {training_consent: bool, redistribution: bool, ...},
    duration:        listing duration,
    revenue_split:   per SSC (e.g., 50/50 for Tier 2),
    individual_did:  ...,
    individual_sig:  Sign(listing_proposal_hash, SK_individual)
  }

Step 3: ORG APPROVAL
  Each applicable org receives listing_proposal.
  
  Org sees: number of ACUs, domains, price, terms, split.
  Org does NOT see content (unless content review requested 
  and approved per Chapter 5.3).
  
  Org can: Approve / Reject / Request Review
  
  If approved:
    org_sig = Sign(listing_proposal_hash, SK_org)

Step 4: MARKETPLACE LISTS
  Marketplace verifies:
  ✓ Individual signature valid
  ✓ All applicable org signatures valid
  ✓ SSC is active and in good standing
  ✓ Tier allows listing
  ✓ Revenue split matches SSC terms
  
  Listing goes live with marker: "Dual-authorized data"
  Buyer sees: this data has organizational co-authorization.

Step 5: SALE EXECUTION
  When buyer purchases:
  
  Revenue distribution (automated, on-chain):
    Protocol fee:     → VIVIM treasury
    Individual share: → Individual's wallet
    Org share:        → Org's wallet
    
  Data delivery:
    Buyer receives: ACU data + export_token (both signatures)
    Export_token serves as proof of authorized acquisition.

═══════════════════════════════════════════════════════
BUYER VERIFICATION
═══════════════════════════════════════════════════════

Any buyer of VIVIM data can verify:

1. Provenance: The ACU chain of custody is verifiable on-chain
2. Authorization: Export_token contains valid dual signatures
3. Tier: The data's tier is recorded (buyer knows what they're getting)
4. Freshness: Timestamps prove when data was created and authorized

A buyer who acquires data without a valid export_token 
(or with a forged one) has NO legal protection under the 
VIVIM protocol and is liable for unauthorized data use.
```

### 8.2 Detection Revenue & Joint Claims

When VIVIM's detection algorithms find unauthorized use of shared-sovereignty data, both parties have standing to claim.

```
JOINT DETECTION CLAIM FLOW

═══════════════════════════════════════════════════════
TRIGGER: Detection algorithm finds evidence that Tier 2+ 
data from an individual's vault appears in a model without 
authorization (no valid export_token exists for this model/provider).
═══════════════════════════════════════════════════════

Step 1: INDIVIDUAL runs detection (Algorithms 1-13)
  Results indicate: Tier 2 ACUs from SSC with Acme Corp 
  appear to be in Model X's training data.

Step 2: INDIVIDUAL shares detection report with Org
  Per SSC terms, detection results on Tier 2+ data are 
  shared with applicable orgs.
  
  Report includes: ACU IDs, scores, evidence, model identified.
  Report does NOT include ACU content (org can request review 
  if needed for claim).

Step 3: EITHER PARTY can initiate a claim
  Individual can file a sovereignty claim independently.
  Organization can file a sovereignty claim independently.
  
  PREFERRED: Joint claim (both parties sign)
  → Stronger legal standing (both rights holders represented)
  → Single proceeding, coordinated evidence
  → Revenue from resolution split per SSC terms

Step 4: EVIDENCE PACKAGE
  If joint claim:
    evidence_package = {
      detection_report:    Algorithm outputs
      acu_provenance:      On-chain timestamps proving priority
      export_token_absence: Proof that no export_token exists 
                            for the offending model's provider
      consent_history:     Complete consent record showing 
                            no authorization was granted
      dual_signatures:     Both parties attest to the claim
    }

Step 5: RESOLUTION
  Damages/settlement split per SSC marketplace_revenue_split.
  Both parties must agree to any settlement.
  (Mutual veto applies to resolution terms too.)
```

---

## Chapter 9: Lifecycle Management

### 9.1 Relationship Lifecycle Events

```
LIFECYCLE EVENT                    SYSTEM RESPONSE
═══════════════════════════════════════════════════════

ONBOARDING (new employee/contractor)
  → SSC created and signed by both parties
  → Classification engine configured with org's signals
  → Existing personal data is NOT retroactively classified
    (SSC governs only data created AFTER activation)
  → Grace period (default: 7 days) during which 
    classification errors can be corrected without 
    being logged as disputes

ROLE CHANGE (promotion, team transfer)
  → SSC amendment: covered_domains may change
  → New domain signals added
  → Previously classified ACUs are NOT reclassified
    (avoid chilling effect on career mobility)
  → Going forward, new domains apply to new data

RELATIONSHIP END (resignation, termination, contract end)
  → SSC enters SUNSET state
  → No new data is classified under this SSC
  → Existing Tier 2 data: sunset clock starts (default 24 months)
  → Existing Tier 3 data: sunset clock starts (default 36 months)
  → Existing Tier 4 data: governed by regulation, not sunset
  → Org retains veto right during sunset period
  → After sunset: data reclassified per SSC sunset provisions
    (typically Tier 2 → Tier 0, Tier 3 → Tier 1)

ACQUISITION (org acquired by another company)
  → New parent company does NOT automatically inherit SSCs
  → Individual must sign new SSC with acquiring entity
  → If individual refuses: existing SSC enters sunset
  → Data portability: all metadata and authorization history 
    transfers to new SSC if individual agrees

INDIVIDUAL DEATH / INCAPACITY
  → SSC provisions govern (should be specified in SSC)
  → Default: data remains in vault, Tier designations persist,
    estate/designated beneficiary assumes individual's position
  → Org's interest does not increase due to individual's death

ORGANIZATION DISSOLUTION
  → All SSCs with that org enter immediate sunset
  → Sunset period is the SHORTER of: standard period or 
    6 months (org no longer exists to enforce interest)
  → After sunset: all data reclassified to Tier 0

DISPUTE → LITIGATION
  → SSC's dispute resolution governs
  → If dispute reaches external litigation:
    - VIVIM protocol provides audit trail as evidence
    - Neither party can modify on-chain records
    - Litigation hold: no data deletion until resolved
```

### 9.2 Sunset Schedule Visualization

```
SUNSET TIMELINE (Employee departure example)

Relationship end: 2026-01-15
SSC sunset provisions: Tier 2 → 24 months, Tier 3 → 36 months

2026    2027    2028    2029
├───────┼───────┼───────┼────
│                             
│  Tier 2 data:               
│  ████████████████████▓▓▓    
│  ← org veto active →│← Tier 0 (individual full control)
│                      │
│  Tier 3 data:               
│  ████████████████████████████████▓▓▓
│  ← org veto active ──────────────→│← Tier 1
│                                    │
│  Tier 4 data:
│  ████████████████████████████████████████→ (per regulation)
│  ← regulatory compliance, no automatic sunset →

During sunset period:
  • Individual CAN read all data (always)
  • Individual CANNOT share/sell without org co-sign (veto persists)
  • Org CANNOT add new designations (relationship ended)
  • Org CAN exercise existing veto rights
  • Org CAN request content review (per standard process)
  
After sunset:
  • Individual regains full sovereignty
  • On-chain record: "Sunset completed. Individual sole owner."
  • Org's signing key is revoked for this SSC
  • Previous export_tokens remain valid (authorized uses persist)
```

---

## Chapter 10: Integration with Detection Algorithms

### 10.1 Detection on Shared-Sovereignty Data

The thirteen detection algorithms (from the VIVIM Detection Architecture) must account for shared-sovereignty designations.

```
DETECTION INTEGRATION RULES

═══════════════════════════════════════════════════════
WHO RUNS DETECTION?
═══════════════════════════════════════════════════════

The INDIVIDUAL always runs detection.
Detection runs locally, in the individual's VIVIM client.
The individual controls when and how detection runs.

The individual is INCENTIVIZED to run detection because:
  1. Their data sovereignty is at stake
  2. Detection of unauthorized use → compensation (their share)
  3. The org may require periodic detection reports per SSC

═══════════════════════════════════════════════════════
WHAT HAPPENS WITH RESULTS?
═══════════════════════════════════════════════════════

For Tier 0-1 data:
  Results belong to individual. No sharing required.

For Tier 2+ data:
  Per SSC, individual shares detection REPORT with org.
  Report contains:
    ✓ ACU IDs flagged
    ✓ Detection scores and statistical significance
    ✓ Model(s) identified
    ✓ Evidence summaries
    ✗ NOT the ACU content itself (unless content review approved)
  
  This enables the org to:
    • Assess risk to their proprietary information
    • Decide whether to pursue a joint claim
    • Update their security posture if data is leaking

═══════════════════════════════════════════════════════
CANARY TOKENS (Algorithm 6) ON SHARED DATA
═══════════════════════════════════════════════════════

Special consideration: When planting canary tokens in 
conversations that may contain shared-sovereignty data:

  The canary itself should be PERSONAL (Tier 0):
    • Canary is a phrase/concept invented by the individual
    • The canary does not contain proprietary information
    • The canary is planted in the individual's message 
      (not in org-proprietary context)
    
  But the SURROUNDING context may be Tier 2+:
    • If the canary is planted in a conversation about 
      proprietary topics, the conversation is Tier 2+
    • If the canary is detected in a model, the CANARY DETECTION 
      is Tier 0 (the canary itself is personal)
    • But the INFERENCE (that the proprietary conversation was 
      trained on) involves Tier 2+ data → shared reporting

  Recommendation: Maintain a separate canary-only conversation 
  stream that is clearly Tier 0, to avoid complicating 
  shared-sovereignty governance.

═══════════════════════════════════════════════════════
CROSS-PROVIDER DETECTION (Algorithm 5) WITH SHARED DATA
═══════════════════════════════════════════════════════

Cross-provider contamination detection is ESPECIALLY 
important for shared-sovereignty data because:

  If the individual shared proprietary data with Provider A 
  (with org's consent via export_token), and that data appears 
  in Provider B's model (no export_token), then:

  → Provider A may have shared the org's proprietary data 
    with Provider B without authorization
  → This is a violation against BOTH the individual AND the org
  → Joint detection is more powerful (org can provide additional 
    context about what makes the data proprietary)
  → Joint claim has stronger legal standing

═══════════════════════════════════════════════════════
CONSERVATION LAW VERIFICATION (Algorithm 13) EXTENSION
═══════════════════════════════════════════════════════

The information balance sheet must account for 
authorized dual-signed exports:

  INFORMATION CREATED:           I_total
  
  INFORMATION WITH ORG INTEREST: I_shared (Tier 2+)
  
  AUTHORIZED EXPORTS:            I_authorized (with export_tokens)
    Per org:                     I_auth_org
    
  DETECTED IN MODELS:            I_detected
    With valid export_token:     I_detected_authorized (expected)
    Without valid export_token:  I_detected_unauthorized (VIOLATION)
  
  CONSERVATION CHECK:
    I_detected_unauthorized should be ≈ 0
    If I_detected_unauthorized > 0:
      → Unauthorized use detected
      → Identify source: individual leaked? Provider leaked? Broker?
      → On-chain export_token absence proves no authorization
```

---

## Chapter 11: Edge Cases & Conflict Resolution

### 11.1 Critical Edge Cases

```
EDGE CASE 1: INDIVIDUAL DISAGREES WITH CLASSIFICATION
─────────────────────────────────────────────────────
Scenario: Individual writes about general algorithm design.
Classifier flags as Tier 2 (org domain: "eng-backend-systems").
Individual believes this is general knowledge, not proprietary.

Resolution:
  1. Individual files challenge (cost: zero)
  2. Provides argument: "This discusses general CS concepts,
     not Acme's proprietary implementation"
  3. Org has 72 hours to respond
  4. If org agrees → reclassified to Tier 0
  5. If org disagrees → neutral arbiter reviews
  6. During dispute → Tier 2 applies (precautionary)
  7. Arbiter decision is binding with one appeal

Key principle: When in doubt, the individual can always 
WRITE and KEEP the data. The dispute only affects 
EXTERNAL sharing rights. The individual is never prevented 
from having conversations with AI.


EDGE CASE 2: ORG RETROACTIVELY DESIGNATES OLD DATA
─────────────────────────────────────────────────────
Scenario: Six months into employment, org realizes their 
classification signals missed a category. They want to 
retroactively designate 500 ACUs.

Resolution:
  1. Retroactive designation within 30-day window? 
     → Standard process (individual notified, can challenge)
  2. Beyond 30-day window? 
     → Requires SSC amendment (bilateral)
     → Individual can refuse (no forced reclassification beyond window)
     → If individual agrees → new classification applied going forward
     → Historical data reclassification requires individual consent
  3. 5% quarterly cap prevents mass retroactive designation


EDGE CASE 3: TWO ORGS HAVE CONFLICTING INTERESTS
─────────────────────────────────────────────────────
Scenario: Individual consults for both Company A and Company B.
Individual has insight that benefits both but is proprietary to each.

Resolution:
  1. If the ACU contains BOTH companies' proprietary data:
     → Both SSCs apply → unanimous consent required
     → In practice: neither company will approve sharing with the other
     → This data is effectively locked (correct behavior)
  2. If the insight is the INDIVIDUAL'S synthesis:
     → Individual can argue for Tier 0 or Tier 1 classification
     → If the synthesis doesn't reproduce either company's 
        proprietary substance, it's the individual's
     → This is where Axiom A7 (Severability) applies
  3. Mediator may be needed if classification is disputed


EDGE CASE 4: INDIVIDUAL ATTEMPTS TO CIRCUMVENT VETO
─────────────────────────────────────────────────────
Scenario: Individual extracts Tier 2 data from vault and 
shares it outside the VIVIM ecosystem.

Protections:
  1. TECHNICAL: 
     - VIVIM-compliant recipients reject unverified data
     - Export_token absence is verifiable
     - BUT: individual can screenshot/copy-paste plaintext
       (technical enforcement cannot prevent this entirely)
  
  2. LEGAL:
     - On-chain record proves the data was Tier 2
     - SSC terms constitute a binding contract
     - Individual is liable for breach
     - This is analogous to NDA enforcement: technical measures 
       reduce casual violation; legal measures address intentional violation
  
  3. DETERRENT:
     - VIVIM reputation system tracks violations
     - Individuals with violations have lower trust scores
     - Future SSCs may include higher scrutiny
     - Detection algorithms may detect the leaked data in 
       unauthorized systems, creating evidence trail


EDGE CASE 5: ORG BECOMES ADVERSARIAL
─────────────────────────────────────────────────────
Scenario: Organization abuses the system to suppress 
the individual — mass Tier 3 classification, vetoing 
all marketplace listings, retroactive over-designation.

Protections:
  1. 5% retroactive designation cap (prevents mass reclassification)
  2. Challenge process (individual can dispute every classification)
  3. SSC early termination (individual can exit with 30 days notice)
  4. Sunset provisions (data eventually reverts to individual control)
  5. VIVIM DAO oversight (patterns of abuse trigger review)
  6. Axiom A2 (individual can always READ — org cannot suppress access)
  7. Classification confidence transparency (individual can see WHY 
     each ACU was classified, and challenge weak classifications)
  8. Aggregate abuse detection: if org vetoes >90% of requests 
     without content review → flagged for pattern review


EDGE CASE 6: DATA CREATED BEFORE SSC EXISTS
─────────────────────────────────────────────────────
Scenario: Individual has 2 years of VIVIM data, then starts 
a new job and signs an SSC.

Resolution:
  SSCs are PROSPECTIVE ONLY. They govern data created AFTER 
  SSC activation. Pre-existing data is never retroactively 
  classified under a new SSC.
  
  Exception: If the individual voluntarily imports existing 
  data into a shared-sovereignty context (e.g., shares 
  historical analysis with new employer via VIVIM), that 
  specific act of sharing can create shared-sovereignty 
  status. But this requires the individual's affirmative act.


EDGE CASE 7: INDIVIDUAL'S PERSONAL GROWTH VS ORG IP
─────────────────────────────────────────────────────
Scenario: Through years of working with org's proprietary 
systems, individual has developed deep expertise. They leave 
the company. Their general expertise is PERSONAL. The specific 
proprietary details are SHARED. But the line is blurry.

Resolution:
  This is the hardest edge case and mirrors the real-world 
  non-compete / trade secret tension.
  
  VIVIM's approach (Axiom A7 — Severability):
  1. General skills, techniques, and knowledge → Tier 0 (personal)
  2. Specific proprietary implementations → Tier 2/3 (shared)
  3. The individual's NOVEL SYNTHESIS → Tier 0 or Tier 2 depending 
     on whether the synthesis is separable from the proprietary input
  
  The classification engine should be configured to recognize:
  - General programming patterns → Tier 0
  - Industry-standard approaches → Tier 0
  - Org-specific implementations of general approaches → Tier 2
  - Org-specific proprietary algorithms → Tier 3
  
  The excluded_domains section of the SSC (e.g., "personal-development") 
  provides a contractual safe harbor for general learning.
```

### 11.2 Dispute Resolution Protocol

```
DISPUTE RESOLUTION: Three-Tier System

═══════════════════════════════════════════════════════
TIER 1: BILATERAL RESOLUTION (0-72 hours)
═══════════════════════════════════════════════════════

Disputing party files challenge with:
  - ACU(s) in question
  - Current classification
  - Proposed classification
  - Argument (free text, max 1000 words)

Other party reviews and responds:
  ACCEPT  → Reclassification applied immediately
  COUNTER → Counter-argument filed
  IGNORE  → After 72 hours, escalate to Tier 2

═══════════════════════════════════════════════════════
TIER 2: ARBITRATION (72 hours - 14 days)
═══════════════════════════════════════════════════════

Neutral arbiter selected from VIVIM arbitration pool.
Arbiter qualifications: domain expertise, no conflict of interest.

Arbiter reviews:
  - Both parties' arguments
  - ACU metadata (and content if both parties consent)
  - SSC terms (covered domains, classification policy)
  - Classification engine's rationale

Arbiter issues binding decision:
  - Tier assignment with reasoning
  - Any process improvements recommended
  - Cost allocation (default: losing party pays arbiter fee)

═══════════════════════════════════════════════════════
TIER 3: APPEAL PANEL (14 days - 30 days)
═══════════════════════════════════════════════════════

One appeal allowed, to a panel of 3 arbiters.
Panel decision is final within the VIVIM protocol.
Parties retain right to external legal proceedings.
```

---

## Chapter 12: Technical Implementation Requirements

### 12.1 Component Architecture

```
COMPONENT MAP

┌────────────────────────────────────────────────────────────┐
│                  VIVIM CLIENT (Individual)                  │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ Vault Engine  │  │Classification│  │  Consent Manager │ │
│  │              │  │   Engine     │  │                  │ │
│  │ • Storage    │  │              │  │ • Request queue  │ │
│  │ • Encryption │  │ • NER        │  │ • Approval flow  │ │
│  │ • Indexing   │  │ • Semantic   │  │ • Export token   │ │
│  │ • Export     │  │ • Code match │  │   generation     │ │
│  │              │  │ • Policy     │  │ • Signature      │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                    │           │
│  ┌──────┴─────────────────┴────────────────────┴─────────┐ │
│  │              LOCAL PROCESSING CORE                     │ │
│  │  All classification and encryption happens here.       │ │
│  │  No raw data leaves the client.                        │ │
│  └───────────────────────┬───────────────────────────────┘ │
│                          │                                 │
│  ┌───────────────────────┴───────────────────────────────┐ │
│  │              DETECTION ENGINE                          │ │
│  │  Algorithms 1-13, running on locally-stored data       │ │
│  │  Results (not data) can be shared per SSC terms        │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────┬───────────────────────────────┘
                             │ (metadata only, encrypted)
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    ON-CHAIN LAYER                           │
│                                                            │
│  • SSC registry (contract hashes and signatures)           │
│  • Classification decision log (hashes only)               │
│  • Export token registry                                   │
│  • Consent/veto transaction log                            │
│  • Revenue distribution records                            │
│  • Dispute filings and resolutions                         │
│  • Sunset and lifecycle events                             │
│                                                            │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│              ORGANIZATION DASHBOARD (Web/API)              │
│                                                            │
│  • Metadata viewer (no content access)                     │
│  • Consent approval interface                              │
│  • Detection report viewer                                 │
│  • Dispute management                                      │
│  • Signal management (update entity lists, code hashes)    │
│  • Analytics (aggregate classification statistics)         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 12.2 Performance Requirements

| Component | Requirement | Rationale |
|-----------|------------|-----------|
| Classification latency | < 500ms per ACU | Must not noticeably delay conversation flow |
| Classification throughput | ≥ 100 ACUs/second | Batch processing for historical analysis |
| Export token generation | < 2 seconds | Includes on-chain transaction |
| Consent notification delivery | < 30 seconds | Org should receive requests promptly |
| Vault encryption/decryption | < 50ms per ACU | Transparent to user |
| On-chain transaction confirmation | < 60 seconds | Acceptable for governance operations |
| Dispute notification | < 5 minutes | Not time-critical |
| Dashboard metadata refresh | < 5 seconds | Standard web performance |
| Detection algorithm integration | Async, non-blocking | Detection runs in background |

### 12.3 Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Data at rest** | AES-256-GCM, keys derived from individual's master key |
| **Data in transit** | TLS 1.3 minimum, certificate pinning |
| **Classification signals** | Org-provided signals (entity lists, code hashes) encrypted in transit and at rest. Never contain raw proprietary data — only detection signals. |
| **Export tokens** | Ed25519 signatures, on-chain verification, replay protection via nonce |
| **Key management** | Individual's master key never leaves their device. Hardware security module (HSM) or secure enclave recommended. |
| **Org dashboard auth** | SSO integration, MFA mandatory, role-based access, audit logging |
| **Arbiter access** | Temporary, scoped, time-limited access to dispute materials. Auto-revoked after resolution. |
| **Adversarial robustness** | Classification engine must resist prompt injection (individual crafting data to avoid classification). Semantic matching + entity detection + code fingerprinting provides defense in depth. |

---

## Chapter 13: Governance & Protocol Economics

### 13.1 SSC Creation Fee Structure

```
SSC ECONOMICS

Creation:
  Individual:     Free (VIVIM subsidizes individual participation)
  Organization:   Fee based on org size and SSC complexity
    Small org (<50 employees):    $500/year
    Medium org (50-1000):         $5,000/year  
    Enterprise (1000+):           $25,000/year + per-SSC fees
    
  Fee covers:
    • On-chain SSC storage
    • Classification engine licensing
    • Arbitration pool access (first 3 disputes/year included)
    • Dashboard access
    • API access

Revenue Split:
  When shared-sovereignty data is sold or generates detection damages:
    VIVIM protocol fee:  5% of gross
    Remaining 95%:       Split per SSC terms between individual and org

Arbitration:
  First 3 disputes/year: Included in org fee
  Additional disputes:   $200 per dispute (paid by losing party)
  Appeal:                $500 (paid by appealing party, refunded if appeal succeeds)
```

### 13.2 VIVIM DAO Oversight

The VIVIM DAO has oversight responsibilities for the shared-sovereignty system:

```
DAO OVERSIGHT FUNCTIONS

1. ARBITER POOL MANAGEMENT
   • Qualification standards for arbiters
   • Performance reviews (decision quality, speed, fairness)
   • Conflict of interest monitoring
   • Arbiter compensation

2. ABUSE DETECTION
   • Monitor for org patterns suggesting abuse:
     - Excessive retroactive designation
     - Universal veto (blocking all individual requests)
     - Classification signal manipulation
   • Monitor for individual patterns suggesting circumvention:
     - Systematic tier challenge of correctly classified data
     - Data exfiltration outside VIVIM ecosystem
   
3. PROTOCOL UPGRADES
   • Classification engine model updates
   • SSC schema versioning
   • Tier definition amendments (require supermajority vote)
   • Fee structure adjustments

4. REGULATORY LIAISON
   • Maintain Tier 4 compliance frameworks per jurisdiction
   • Update regulatory keyword lists
   • Interface with regulators on protocol compliance
```

---

## Chapter 14: Implementation Roadmap

### 14.1 Phased Delivery

```
PHASE 1: FOUNDATION (Months 1-4)
────────────────────────────────────────
Deliver:
  ✓ SSC schema v1 (on-chain contract format)
  ✓ Basic classification engine (entity matching + keyword rules)
  ✓ Vault schema extensions for shared-sovereignty fields
  ✓ Export token generation and verification
  ✓ Individual consent flow (request → approve/reject)

Test with:
  • 10 pilot organizations (varied sizes)
  • 500 individual users
  • Focus on Tier 0/2 only (skip Tier 3/4 for now)


PHASE 2: INTELLIGENCE (Months 5-8)
────────────────────────────────────────
Deliver:
  ✓ Semantic classification engine (embedding-based domain matching)
  ✓ Code fingerprint matching
  ✓ Organization dashboard v1
  ✓ Organization API
  ✓ Tier 3 support (custodial data)
  ✓ Dispute resolution system (Tier 1 bilateral only)

Test with:
  • 50 organizations
  • 5,000 individual users
  • Classification accuracy benchmarking


PHASE 3: GOVERNANCE (Months 9-12)
────────────────────────────────────────
Deliver:
  ✓ Arbitration pool and Tier 2-3 dispute resolution
  ✓ Marketplace integration for dual-signed listings
  ✓ Revenue splitting automation
  ✓ Sunset management system
  ✓ Lifecycle event handling (offboarding, role changes)
  ✓ Tier 4 framework (first jurisdiction: EU/GDPR)

Test with:
  • 200 organizations
  • 25,000 individual users
  • First marketplace transactions with shared-sovereignty data


PHASE 4: SCALE & COMPLIANCE (Months 13-18)
────────────────────────────────────────
Deliver:
  ✓ Tier 4 multi-jurisdiction support
  ✓ Detection algorithm integration (Algorithms 1-13 with SSC awareness)
  ✓ Joint claim system
  ✓ DAO governance activation
  ✓ Advanced classification (context-aware, multi-turn conversation understanding)
  ✓ Multiple concurrent SSC support (overlapping interests)
  ✓ Organization federation (parent/subsidiary SSC inheritance)

Scale to:
  • 1,000+ organizations
  • 100,000+ individual users
  • Cross-jurisdictional compliance certified
```

---

## Chapter Summary & Deep-Dive Index

| Chapter | Title | Core Question Answered | Key Deliverable |
|---------|-------|----------------------|-----------------|
| **0** | The Problem | Why does shared sovereignty matter? | Problem statement and motivation |
| **1** | Principles | What rules can never be broken? | Seven non-negotiable axioms |
| **2** | Ontology | What makes data "shared"? | Five-tier classification framework |
| **3** | Registration | How do parties establish their relationship? | Shared Sovereignty Contract (SSC) schema |
| **4** | Classification | How is data classified in real-time? | Classification engine pipeline |
| **5** | Access Control | How is mutual veto enforced cryptographically? | Dual-key export token system |
| **6** | Vault Architecture | How is shared data stored? | Extended ACU schema and vault partitioning |
| **7** | Org Interface | What can the organization see and do? | Dashboard and API specification |
| **8** | Marketplace | How is dual-owned data bought and sold? | Dual-signed listing and revenue split flow |
| **9** | Lifecycle | What happens when relationships change? | Sunset provisions and lifecycle event handling |
| **10** | Detection | How do detection algorithms handle shared data? | Detection integration rules and joint claims |
| **11** | Edge Cases | What happens when things go wrong? | Conflict resolution protocol |
| **12** | Implementation | What are the technical requirements? | Component architecture and performance specs |
| **13** | Economics | How is the system sustained? | Fee structure and DAO governance |
| **14** | Roadmap | How do we build this? | Four-phase delivery plan |

---

*Each chapter is designed as a self-contained deep-dive target. The system's coherence comes from the seven axioms in Chapter 1 — every subsequent design decision traces back to them. When axioms conflict, the numbering resolves the conflict. When edge cases arise, the axioms provide the reasoning framework. The architecture is human-centric not as aspiration but as a structural invariant enforced at every layer: cryptographic, contractual, and computational.*
