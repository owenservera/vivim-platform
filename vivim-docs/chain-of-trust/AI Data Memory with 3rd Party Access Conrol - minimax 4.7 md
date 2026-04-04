# VIVIM Third-Party Data Ownership Engine
## E2E System Blueprint — Co-Ownership & Joint Custody Architecture

---

# Executive Vision

**The Problem**: Current AI ecosystems allow companies to unilaterally use user data while users have no recourse, visibility, or control. Even in collaborative scenarios — where data is genuinely co-created with third parties — there is no mechanism for joint governance.

**The Solution**: A third-party determinant engine that operates at the point of data creation, automatically classifies ownership structure, and deploys appropriate governance contracts. When third-party interests exist, a **50/50 joint custody model** activates — neither party can unilaterally access, modify, share, or delete data without the other's consent.

**Core Principle**: The human's VIVIM vault always retains the physical data. The innovation is in the **governance layer** — a smart contract system that gives third parties co-equal say over their interest in that data, enforced cryptographically.

---

# Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           VIVIM ECOSYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                    HUMAN'S SOVEREIGN VIVIM VAULT                         │   │
│   │  ┌──────────────────────────────────────────────────────────────────┐  │   │
│   │  │                    SOLE-OWNED DATA LAYER                          │  │   │
│   │  │    Human has 100% control — full sovereign access, no contracts   │  │   │
│   │  └──────────────────────────────────────────────────────────────────┘  │   │
│   │                                  │                                       │   │
│   │                    ┌────────────┴────────────┐                        │   │
│   │                    │  THIRD-PARTY DETERMINANT  │                        │   │
│   │                    │        ENGINE             │                        │   │
│   │                    │   [AUTOMATIC CLASSIFIER] │                        │   │
│   │                    └────────────┬────────────┘                        │   │
│   │                                  │                                       │   │
│   │          ┌──────────────────────┼──────────────────────┐               │   │
│   │          │                      │                      │               │   │
│   │          ▼                      ▼                      ▼               │   │
│   │  ┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐      │   │
│   │  │  SOLE-OWNED   │    │  JOINT-CUSTODY  │    │  LICENSED-USE   │      │   │
│   │  │    DATA       │    │     DATA        │    │     DATA        │      │   │
│   │  │  (No Change)  │    │   (50/50 Gov)   │    │  (Contractual)  │      │   │
│   │  └───────────────┘    └────────┬────────┘    └────────┬────────┘      │   │
│   │                                │                     │                │   │
│   │                    ┌───────────┴───────────┐        │                │   │
│   │                    │  JOINT GOVERNANCE     │        │                │   │
│   │                    │    SMART CONTRACT    │        │                │   │
│   │                    │  ┌───────────────┐   │        │                │   │
│   │                    │  │ On-Chain Rules│   │        │                │   │
│   │                    │  │ 50/50 Veto    │   │        │                │   │
│   │                    │  │ Access Ctrl   │   │        │                │   │
│   │                    │  │ Dispute Layer │   │        │                │   │
│   │                    │  └───────────────┘   │        │                │   │
│   │                    └───────────┬──────────┘        │                │   │
│   │                                │                   │                │   │
│   │                                ▼                   ▼                │   │
│   │                    ┌───────────────────────┐  ┌─────────────────┐  │   │
│   │                    │  3RD PARTY'S VIVIM    │  │  3RD PARTY'S    │  │   │
│   │                    │    (Co-Custodian)     │  │  EXTERNAL SYS   │  │   │
│   │                    │  Mirror & Index Only  │  │  (Licensee)      │  │   │
│   │                    └───────────────────────┘  └─────────────────┘  │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │                      BLOCKCHAIN LAYER                                   │   │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │   │
│   │  │ Governance │  │   Audit    │  │  Dispute   │  │  Identity  │       │   │
│   │  │  Contracts │  │   Trail    │  │Resolution  │  │ Registry   │       │   │
│   │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# Chapter 1: Third-Party Determinant Engine

## Purpose

Automatically detects, at the point of data creation, whether third-party ownership interests exist. This is the **gatekeeper** — it determines which governance model applies to each piece of data.

## Detection Triggers

```
THIRD-PARTY DETERMINATION TRIGGERS

┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATIC DETECTION ENGINE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TRIGGER CATEGORY 1: CONTENT-BASED                            │
│   ├── Copyrighted content detected in input                     │
│   │     ├── Text (>= 90 char match with known work)           │
│   │     ├── Code (>= 50 char match, MIT/GPL/Apache/etc)      │
│   │     ├── Images (perceptual hash match)                    │
│   │     └── Media (audio/video fingerprint)                  │
│   │                                                             │
│   │     → Classifies as: LICENSED-USE / THIRD-PARTY           │
│   │                                                             │
│   TRIGGER CATEGORY 2: CONTEXT-BASED                           │
│   ├── Employer/employee relationship detected                   │
│   │     ├── Email from corporate domain                        │
│   │     ├── Explicit employment mention                        │
│   │     └── Work product patterns (W-2, contract, NDA)       │
│   │                                                             │
│   │     → Classifies as: EMPLOYER-DERIVED                     │
│   │                                                             │
│   TRIGGER CATEGORY 3: RELATIONSHIP-BASED                      │
│   ├── Co-author detected (shared conversation with 3rd party)  │
│   │     ├── Collaborative document editing                     │
│   │     ├── Multi-party chat/thread                           │
│   │     └── Shared project context                            │
│   │                                                             │
│   │     → Classifies as: JOINT-CREATED                        │
│   │                                                             │
│   TRIGGER CATEGORY 4: INTENT-BASED                            │
│   ├── User explicitly tags data with 3rd-party interest       │
│   │     ├── "@company/confidential" tag                       │
│   │     ├── "client-work" classification                       │
│   │     └── "joint-project" designation                         │
│   │                                                             │
│   │     → Classifies as: USER-DECLARED                        │
│   │                                                             │
│   TRIGGER CATEGORY 5: CONTRACTUAL-BASED                      │
│   ├── NDA, contract, or agreement referenced                  │
│   │     ├── "confidential" language detected                   │
│   │     ├── Legal document attached/linked                     │
│   │     └── Terms of service conflict detected                │
│   │                                                             │
│   │     → Classifies as: CONTRACTUAL-BOUND                    │
│   │                                                             │
└─────────────────────────────────────────────────────────────────┘
```

## Ownership Classification Taxonomy

```
OWNERSHIP CLASSIFICATION TAXONOMY

TIER 0: SOLE OWNERSHIP (HUMAN-CENTRIC)
═══════════════════════════════════════
Ownership: 100% Human
Control: Full sovereign (no third-party interest)
Governance: VIVIM human-centric rules apply
Third-Party Access: None without explicit human consent

TIER 1: JOINT CREATION (50/50 CUSTODY)
═══════════════════════════════════════════
Ownership: 50% Human / 50% Third Party
Control: Equal veto — both parties must consent
Governance: Joint smart contract (see Chapter 2)
Third-Party Access: Via smart contract only

    Examples:
    • Collaborative document with colleague
    • Shared project planning with partner
    • Multi-party research collaboration
    • Joint creative work

TIER 2: EMPLOYER-DERIVED (VARIABLE 70/30 or 90/10)
═══════════════════════════════════════════════════════
Ownership: Variable based on jurisdiction and contract
Control: Split based on employment agreement
Governance: Employment contract encoded
Third-Party Access: Employer has documented access rights

    Examples:
    • Work emails and documents
    • Code written for employer
    • Client deliverables
    • Business strategies

TIER 3: LICENSED-USE / THIRD-PARTY IP (0/100 or Contractual)
═══════════════════════════════════════════════════════════════
Ownership: 0% Human / 100% Third Party (copyright)
Control: None — human is licensee only
Governance: License contract (see Chapter 3)
Third-Party Access: Full (they own it)

    Examples:
    • Using copyrighted text in analysis
    • Incorporating licensed code
    • Quoting from published works
    • Analyzing proprietary data

TIER 4: CIRCLE-SHARED (HUMAN + AUTHORIZED CIRCLE)
═══════════════════════════════════════════════════════
Ownership: 100% Human (data) / Shared access rights
Control: Human retains sovereignty, grants circle access
Governance: Circle membership contract
Third-Party Access: Circle members per circle rules

    Examples:
    • Family health data shared with family circle
    • Financial planning shared with advisor circle
    • Legal documents shared with lawyer circle

TIER 5: DELEGATED CUSTODY (HUMAN = PRINCIPAL, 3RD PARTY = AGENT)
═══════════════════════════════════════════════════════════════════
Ownership: 100% Human (data) / Agent has execution rights
Control: Human retains ultimate ownership, grants limited agency
Governance: Delegation contract with scope limits
Third-Party Access: Agent can act within defined scope

    Examples:
    • Lawyer managing legal documents on your behalf
    • Financial advisor accessing investment data
    • Caregiver accessing health information
```

## Determination Engine Algorithm

```
ALGORITHM: ThirdPartyDeterminant

INPUT:
  data_fragment    : The ACU or data being created
  context         : Conversation/transaction context
  user_profile     : User's declared interests and relationships
  historical_patterns : User's historical classification patterns

OUTPUT:
  determination: {
    tier: OwnershipTier,
    confidence: float [0, 1],
    third_party_did: Optional[DID],
    ownership_split: (human_%, third_party_%),
    applicable_contract_type: ContractType,
    flags: [WarningFlag],
    requires_explicit_declaration: bool
  }

PROCEDURE:

  // === LAYER 1: AUTOMATED CONTENT ANALYSIS ===
  
  content_signals ← AnalyzeContent(data_fragment)
  
  // Check for copyrighted/third-party content
  IF content_signals.copyrighted_content_detected:
    RETURN Tier3_LicensedUse(content_signals.copyright_holder)
  
  IF content_signals.open_source_code_detected:
    license_type ← IdentifyLicense(content_signals.code_snippet)
    IF license_type.requires_attribution:
      RETURN Tier3_LicensedUse(
        attribution_target = license_type.author,
        attribution_requirements = license_type.requirements
      )
  
  // === LAYER 2: CONTEXT ANALYSIS ===
  
  context_signals ← AnalyzeContext(context, data_fragment)
  
  IF context_signals.employer_relationship_detected:
    employer_did ← ResolveEmployerDID(context)
    RETURN Tier2_EmployerDerived(
      employer = employer_did,
      split = DetermineOwnershipSplit(
        user_jurisdiction = user_profile.jurisdiction,
        employment_contract = context_signals.contract_evidence
      )
    )
  
  IF context_signals.collaborative_session_active:
    collaborators ← IdentifyCollaborators(context)
    FOR each collaborator in collaborators:
      RETURN Tier1_JointCreation(
        co_owner = collaborator.did,
        split = (50, 50),
        requires_consent = TRUE
      )
  
  // === LAYER 3: EXPLICIT USER DECLARATION ===
  
  user_declaration ← CheckUserTags(data_fragment)
  
  IF user_declaration.has_third_party_tag:
    RETURN ClassifyFromTag(
      tag = user_declaration.tag,
      user_profile = user_profile,
      requires_confirmation = TRUE  // Explicit tags need confirmation
    )
  
  // === LAYER 4: CONTRACTUAL ANALYSIS ===
  
  contract_signals ← DetectContractualConstraints(context, data_fragment)
  
  IF contract_signals.nda_detected:
    RETURN Tier5_ContractualBound(
      contract_type = "NDA",
      obligations = contract_signals.nda_terms,
      third_party = contract_signals.nda_counterparty
    )
  
  IF contract_signals.service_agreement_conflict:
    RETURN Tier3_LicensedUse(
      note = "User may not have rights to share this data"
    )
  
  // === LAYER 5: PATTERN LEARNING ===
  
  // Use historical patterns to inform determination
  historical_pattern ← MatchHistoricalPattern(
    data_fragment, 
    historical_patterns
  )
  
  IF historical_pattern.confidence > 0.85:
    RETURN historical_pattern.tier_with_adjustments(
      current_context = context,
      user_profile = user_profile
    )
  
  // === LAYER 6: ESCALATION ===
  
  // If confidence is low, flag for explicit human declaration
  RETURN DeterminationResult(
    tier = UNDETERMINED,
    confidence = CalculateConfidence(content_signals, context_signals),
    requires_explicit_declaration = TRUE,
    suggested_tier = RecommendTier(content_signals, context_signals),
    flags = [
      FLAG_REQUIRES_HUMAN_CONFIRMATION,
      FLAG_LOW_AUTOMATIC_CONFIDENCE
    ]
  )
```

---

# Chapter 2: Joint Custody Data Layer

## Purpose

When Tier 1 (Joint Creation) or Tier 2 (Employer-Derived with significant human contribution) is determined, a **Joint Custody Vault** is created. Both parties have cryptographic co-equal control.

## Joint Custody Architecture

```
JOINT CUSTODY ARCHITECTURE

┌─────────────────────────────────────────────────────────────────────────┐
│                        JOINT CUSTODY VAULT                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    SHARED ENCRYPTION LAYER                      │   │
│  │                                                                 │   │
│  │   Human Key (KH)  ──────┬──────► Combined Key (Kjoint)         │   │
│  │                        │                                        │   │
│  │   3P Key (K3P) ────────┘                                        │   │
│  │                                                                 │   │
│  │   Kjoint = HKDF(KH || K3P || contract_hash)                    │   │
│  │                                                                 │   │
│  │   • Neither party can decrypt alone                             │   │
│  │   • Both keys required for any operation                        │   │
│  │   • Key rotation requires both parties                          │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                   │
│                                    ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      DATA STORAGE                               │   │
│  │                                                                 │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│  │   │ Joint ACUs   │  │ Access Logs  │  │ Metadata     │        │   │
│  │   │ (Encrypted)  │  │ (Immutable)  │  │ (Indexed)    │        │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘        │   │
│  │                                                                 │   │
│  │   The data lives in HUMAN's vault (primary storage)            │   │
│  │   3P has mirrored index + cryptographic proof of existence      │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                   │
│                                    ▼                                   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   GOVERNANCE SMART CONTRACT                     │   │
│  │                                                                 │   │
│  │   On-Chain Contract ID: 0x7f3a...b2c1                          │   │
│  │                                                                 │   │
│  │   ┌─────────────────────────────────────────────────────────┐   │   │
│  │   │                    CONTRACT RULES                        │   │   │
│  │   │                                                          │   │   │
│  │   │   OWNERSHIP_SPLIT: (50%, 50%)                            │   │   │
│  │   │   VETO_REQUIRED: ANY_MATERIAL_CHANGE                      │   │   │
│  │   │   ACCESS_LEVEL: MUTUAL_consent_required                  │   │   │
│  │   │   DELETION_RULE: UNANIMOUS_consent                       │   │   │
│  │   │   DERIVATIVE_RIGHTS: PRE_APPROVAL_required               │   │   │
│  │   │   DISPUTE_RESOLUTION: ESCROW_arbitration                 │   │   │
│  │   │                                                          │   │   │
│  │   └─────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Access Control Matrix

```
JOINT CUSTODY ACCESS CONTROL MATRIX

Operations Matrix:

                    │ Human Alone │ 3P Alone │ Both Required │ Neither
────────────────────┼─────────────┼──────────┼────────────────┼─────────
Read (Personal Use) │     ✓       │    ✓     │       -        │    -
Read (Sharing)      │     -       │    -     │       ✓        │    -
Modify Content      │     -       │    -     │       ✓        │    -
Add New ACU         │     ✓       │    ✓     │       -        │    -  
Delete Single ACU   │     -       │    -     │       ✓        │    -
Delete Entire Vault │     -       │    -     │       -        │    ✗
Grant Read Access   │     -       │    -     │       ✓        │    -
Grant Modify Access │     -       │    -     │       ✓        │    -
Export Data         │     -       │    -     │       ✓        │    -
Train on Data       │     -       │    -     │       ✓        │    -
Sell Data           │     -       │    -     │       ✗        │    -
Fork/Modify/Derive  │     -       │    -     │       ✓        │    -

Legend:
  ✓ = Allowed
  - = Not applicable / No permission needed
  ✗ = Explicitly prohibited

Material Changes Requiring Mutual Consent:
  • Any modification to the underlying data
  • Adding third parties to the custody arrangement
  • Changing the ownership split
  • Modifying termination conditions
  • Granting sub-licenses or derivative rights
```

## Smart Contract Template

```
GOVERNANCE SMART CONTRACT: Joint Custody Agreement

Contract ID: [On-Chain]
Created: [Timestamp]
Parties: [Human DID] ↔ [3P DID]

═══════════════════════════════════════════════════════════
SECTION 1: PARTIES AND OWNERSHIP
═══════════════════════════════════════════════════════════

Party A (Human):
  DID: did:vivim:human:a3f8...c2d1
  Vault: Primary storage location
  Role: Data principal, primary custodian

Party B (Third Party):
  DID: [Resolved from determination]
  Vault: Co-custodian mirror
  Role: Equal co-owner

Ownership Split: [50% / 50%] (default) or [X% / Y%] (custom)

═══════════════════════════════════════════════════════════
SECTION 2: CONSENT REQUIREMENTS
═══════════════════════════════════════════════════════════

2.1 UNANIMOUS CONSENT REQUIRED (Veto Rights)
    The following actions require explicit consent from BOTH parties:

    (a) Any modification, editing, or alteration of Joint Data
    (b) Deletion of any Joint Data item
    (c) Granting access to third parties
    (d) Creating derivative works
    (e) Using Joint Data for training AI models
    (f) Selling, licensing, or transferring Joint Data
    (g) Changing terms of this agreement
    (h) Adding or removing parties from this agreement
    (i) Terminating the custody arrangement

2.2 INDIVIDUAL CONSENT SUFFICIENT
    Either party may, without consent:

    (a) Read and use Joint Data for personal, non-commercial purposes
    (b) Add new Joint Data to the vault (their contributions)
    (c) Create personal notes or annotations (separate from Joint Data)
    (d) Export personal usage analytics

2.3 NOTICE REQUIREMENTS
    For any action requiring mutual consent:
    
    (a) Requesting party must submit formal request via contract
    (b) Other party has 72 hours to respond (configurable)
    (c) Non-response after 72 hours = automatic rejection
    (d) Rejection must include reason (not optional)

═══════════════════════════════════════════════════════════
SECTION 3: ACCESS CONTROL RULES
═══════════════════════════════════════════════════════════

3.1 READ ACCESS
    Who can read: Both parties, plus authorized third parties
    How: Via mutual authentication (both must authenticate)
    Scope: Full read access to all Joint Data

3.2 MODIFY ACCESS
    Who can modify: Neither party alone
    How: Both parties must sign modification transaction
    Scope: Entire Joint Data corpus

3.3 DELETE ACCESS
    Who can delete: Neither party alone
    How: Both parties must sign deletion transaction
    Undo: 30-day grace period before permanent deletion
    Recovery: Either party can restore during grace period

3.4 AI TRAINING ACCESS
    Special rule for AI model training:

    (a) Requires unanimous consent
    (b) Must specify: which model, what training data subset
    (c) Must specify: duration of training use
    (d) Must specify: whether model outputs are derivative
    (e) If derivative, derivative terms must also be agreed

3.5 COMMERCIAL EXPLOITATION
    Any commercial use requires:

    (a) Unanimous consent
    (b) Revenue sharing agreement (default: 50/50)
    (c) Clear documentation of commercial purpose
    (d) Regular accounting of commercial activities

═══════════════════════════════════════════════════════════
SECTION 4: DISPUTE RESOLUTION
═══════════════════════════════════════════════════════════

4.1 ESCALATION PROCEDURE
    Level 1: Direct negotiation (30 days)
    Level 2: Mediated arbitration (VIVIM Dispute Board)
    Level 3: Binding external arbitration

4.2 DEADLOCK RESOLUTION
    If parties cannot agree on a material change:

    (a) Either party may invoke deadlock procedure
    (b) Data enters "frozen" state (no modifications)
    (c) Mediated arbitration begins within 14 days
    (d) Arbitrator may:
        - Approve change (with conditions)
        - Reject change
        - Propose alternative
        - Dissolve custody arrangement

4.3 CUSTODY DISSOLUTION
    If custody cannot continue:

    (a) Joint Data remains in human's vault
    (b) Third party receives encrypted copy for their records
    (c) Human retains 100% future control
    (d) Third party's access is terminated
    (e) All derivative agreements are nullified

═══════════════════════════════════════════════════════════
SECTION 5: TERMINATION CONDITIONS
═══════════════════════════════════════════════════════════

5.1 MUTUAL TERMINATION
    Both parties agree to end custody arrangement

5.2 UNILATERAL TERMINATION (With Penalties)
    One party exits, triggering:
    - 30-day transition period
    - Consent-based data partitioning
    - Possible financial penalties per original agreement

5.3 AUTOMATIC TERMINATION
    - Party permanently incapacitated
    - Party's DID de-registered
    - Insolvency/bankruptcy
    - Legal order requiring separation

5.4 POST-TERMINATION RIGHTS
    - Human retains primary custody (always)
    - 3P may retain encrypted mirror
    - 3P loses all governance rights
    - All derivative agreements are voided
```

---

# Chapter 3: Third-Party Integration Engine

## Purpose

The **plug-in architecture** that allows third parties to connect their systems to VIVIM's joint custody layer. This is the API, authentication, and governance interface that enables corporate partners, employers, and collaborators to participate.

## Integration Architecture

```
THIRD-PARTY INTEGRATION ENGINE

┌─────────────────────────────────────────────────────────────────────────┐
│                    VIVIM THIRD-PARTY GATEWAY                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    IDENTITY LAYER                               │    │
│   │                                                                  │    │
│   │   Third Party authenticates via:                                │    │
│   │   ├── DID Authentication (W3C standard)                         │    │
│   │   ├── OAuth 2.0 + DID binding                                   │    │
│   │   └── MPC (Multi-Party Computation) wallet                      │    │
│   │                                                                  │    │
│   │   Verification:                                                 │    │
│   │   ├── DID resolution and validation                             │    │
│   │   ├── Credential verification (Verifiable Credentials)         │    │
│   │   └── Permission scope validation                               │    │
│   │                                                                  │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    PERMISSION GATEWAY                            │    │
│   │                                                                  │    │
│   │   Request Flow:                                                  │    │
│   │                                                                  │    │
│   │   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    │    │
│   │   │  3P     │───►│ Gateway │───►│ Policy  │───►│ VIVIM   │    │    │
│   │   │ Request │    │ Auth    │    │ Engine  │    │ Core    │    │    │
│   │   └─────────┘    └─────────┘    └─────────┘    └─────────┘    │    │
│   │                          │             │                        │    │
│   │                          ▼             ▼                        │    │
│   │                    ┌───────────┐ ┌───────────┐                    │    │
│   │                    │ Consent   │ │ Contract  │                    │    │
│   │                    │ Registry  │ │ Registry  │                    │    │
│   │                    └───────────┘ └───────────┘                    │    │
│   │                                                                  │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    AUDIT & COMPLIANCE LAYER                     │    │
│   │                                                                  │    │
│   │   Every request is:                                             │    │
│   │   ├── Logged to immutable audit trail                           │    │
│   │   ├── Checked against governance contract                       │    │
│   │   ├── Verified for consent status                               │    │
│   │   └── Monitored for anomaly patterns                            │    │
│   │                                                                  │    │
│   └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Third-Party API Specification

```
VIVIM THIRD-PARTY API v1.0

Base URL: https://api.vivim.io/v1/thirdparty

═══════════════════════════════════════════════════════════════════
AUTHENTICATION
═══════════════════════════════════════════════════════════════════

All API requests require:

Header: Authorization: Bearer <3P_ACCESS_TOKEN>
Header: X-VIVIM-DID: <3P_DID>
Header: X-VIVIM-Signature: <Request_Signature>
Header: X-VIVIM-Timestamp: <Unix_Timestamp>

Access Token obtained via:
  POST /auth/did-auth
  Body: { did: "did:example:corp", challenge: "<server_challenge>" }
  Response: { access_token: "...", expires_in: 3600 }

═══════════════════════════════════════════════════════════════════
ENDPOINT: VAULT STATUS
═══════════════════════════════════════════════════════════════════

GET /vaults/joint/{contract_id}

Returns the status of a joint custody vault.

Response 200:
{
  "contract_id": "0x7f3a...b2c1",
  "parties": [
    {
      "did": "did:vivim:human:a3f8...c2d1",
      "role": "primary_custodian",
      "ownership_percent": 50,
      "consents_pending": 0
    },
    {
      "did": "did:example:corp",
      "role": "co_custodian", 
      "ownership_percent": 50,
      "consents_pending": 1
    }
  ],
  "vault_status": "active",
  "data_summary": {
    "total_acus": 1247,
    "total_bytes": 4583921,
    "categories": ["project_alpha", "research", "communications"]
  },
  "pending_actions": [
    {
      "action": "AI_TRAINING_ACCESS",
      "requested_by": "did:example:corp",
      "requested_at": "2025-01-15T10:30:00Z",
      "expires_at": "2025-01-18T10:30:00Z",
      "status": "pending_human_consent"
    }
  ],
  "audit_trail_url": "/vaults/joint/{contract_id}/audit"
}

═══════════════════════════════════════════════════════════════════
ENDPOINT: REQUEST CONSENT
═══════════════════════════════════════════════════════════════════

POST /vaults/joint/{contract_id}/consent/request

Request consent from the other party for an action.

Request Body:
{
  "action_type": "AI_TRAINING_ACCESS",
  "scope": {
    "data_subset": ["category:project_alpha"],
    "duration_days": 90,
    "model_identifier": "gpt-5-corp-internal",
    "derivative_work": true,
    "revenue_sharing": "50_50"
  },
  "justification": "Training internal model for company project",
  "supporting_docs": ["ipfs://QmXx...Yy"]
}

Response 201:
{
  "consent_request_id": "req_7f3a...9z2",
  "created_at": "2025-01-15T10:30:00Z",
  "expires_at": "2025-01-18T10:30:00Z",
  "required_party_approval": "did:vivim:human:a3f8...c2d1",
  "status": "pending",
  "notification_sent": true
}

═══════════════════════════════════════════════════════════════════
ENDPOINT: RESPOND TO CONSENT REQUEST
═══════════════════════════════════════════════════════════════════

POST /vaults/joint/{contract_id}/consent/{request_id}/respond

Human responds to a consent request.

Request Body:
{
  "decision": "approve",  // or "reject"
  "reason": "Approved for internal research only, not commercial",
  "conditions": [
    "Model must be internal only",
    "No external distribution",
    "Audit rights retained"
  ],
  "signature": "<human_signature>"
}

Response 200:
{
  "consent_request_id": "req_7f3a...9z2",
  "decision": "approved_with_conditions",
  "decided_at": "2025-01-15T14:22:00Z",
  "conditions": ["..."],
  "action_authorized": true,
  "action_expires_at": "2025-04-15T14:22:00Z"
}

═══════════════════════════════════════════════════════════════════
ENDPOINT: READ JOINT DATA
═══════════════════════════════════════════════════════════════════

GET /vaults/joint/{contract_id}/data

Read joint custody data (no consent required for read access).

Query Parameters:
  - category: Filter by category
  - since: ISO timestamp filter
  - limit: Pagination limit (default 100)
  - cursor: Pagination cursor

Response 200:
{
  "data": [
    {
      "acu_id": "acu:7f3a...a1b2",
      "category": "project_alpha",
      "created_at": "2025-01-10T09:00:00Z",
      "created_by": "did:vivim:human:a3f8...c2d1",
      "encrypted_content": "base64...",
      "content_hash": "sha256:...",
      "access_log": [
        {
          "accessed_by": "did:example:corp",
          "at": "2025-01-14T16:30:00Z",
          "operation": "read"
        }
      ]
    }
  ],
  "pagination": {
    "next_cursor": "eyJ...",
    "has_more": true
  }
}

═══════════════════════════════════════════════════════════════════
ENDPOINT: SUBMIT FOR APPROVAL
═══════════════════════════════════════════════════════════════════

POST /vaults/joint/{contract_id}/data

Submit new data to the joint vault (co-creation).

Request Body:
{
  "category": "project_alpha",
  "encrypted_content": "base64...",
  "content_type": "collaborative_document",
  "created_from": ["did:vivim:human:a3f8...c2d1", "did:example:corp"]
}

Response 201:
{
  "acu_id": "acu:9z2...x7y8",
  "status": "co_created",
  "co_ownership_confirmed": true,
  "added_to_vault": "2025-01-15T15:00:00Z"
}

═══════════════════════════════════════════════════════════════════
ENDPOINT: AUDIT TRAIL
═══════════════════════════════════════════════════════════════════

GET /vaults/joint/{contract_id}/audit

Returns complete audit trail for the joint vault.

Response 200:
{
  "contract_id": "0x7f3a...b2c1",
  "entries": [
    {
      "timestamp": "2025-01-15T15:00:00Z",
      "operation": "DATA_ADDED",
      "actor": "did:example:corp",
      "target": "acu:9z2...x7y8",
      "tx_hash": "0x...",
      "block_number": 18543234
    },
    {
      "timestamp": "2025-01-15T14:22:00Z",
      "operation": "CONSENT_APPROVED",
      "actor": "did:vivim:human:a3f8...c2d1",
      "target": "req_7f3a...9z2",
      "conditions": ["..."]
    }
  ],
  "chain_verified": true
}
```

---

# Chapter 4: Dispute Resolution Layer

## Purpose

When parties cannot agree, the dispute resolution layer provides escalation mechanisms — from automatic mediation to binding arbitration.

## Dispute Flow

```
DISPUTE RESOLUTION FLOW

Level 1: AUTOMATED RESOLUTION
═══════════════════════════════════
    ┌─────────────────────────────────────────────────────────┐
    │  Dispute Submitted                                      │
    └─────────────────────┬───────────────────────────────────┘
                          │
                          ▼
    ┌─────────────────────────────────────────────────────────┐
    │  Automatic Analysis                                      │
    │  • Contract terms review                                 │
    │  • Historical precedent search                           │
    │  • Proposed resolution generation                        │
    └─────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         Agreement              No Agreement
         Reached                Reached
              │                       │
              ▼                       ▼
         ┌─────────┐        Level 2: MEDIATED ARBITRATION
         │ Resolved│        ═══════════════════════════════
         └─────────┘
                          ┌───────────────────────────────┐
                          │  VIVIM Dispute Board          │
                          │  • Human + AI mediators       │
                          │  • 14-day resolution window   │
                          │  • Non-binding recommendations │
                          └─────────────┬─────────────────┘
                                        │
                            ┌───────────┴───────────┐
                            │                       │
                       Agreement              No Agreement
                       Reached                Reached
                            │                       │
                            ▼                       ▼
                       ┌─────────┐        Level 3: BINDING ARBITRATION
                       │ Resolved│        ═══════════════════════════════
                       └─────────┘
                                        ┌───────────────────────────────┐
                                        │  External Arbitrator          │
                                        │  • Legal binding decision    │
                                        │  • Enforceable in all major  │
                                        │    jurisdictions              │
                                        │  • Final resolution           │
                                        └─────────────┬─────────────────┘
                                                      │
                                                      ▼
                                                 ┌─────────┐
                                                 │ RESOLVED│
                                                 │ (Final) │
                                                 └─────────┘
```

## Smart Contract Dispute Module

```
DISPUTE RESOLUTION SMART CONTRACT MODULE

Contract Extension: JointCustodyDispute

═══════════════════════════════════════════════════════════
DISPUTE TYPES AND RESOLUTION PATHS
═══════════════════════════════════════════════════════════

Type 1: CONSENT_DEADLOCK
─────────────────────────
Description: One party requests action, other party rejects, no consensus

Auto-Resolution:
  (a) 72-hour negotiation period
  (b) Automated mediation proposal
  (c) If rejected: data frozen pending arbitration
  
Escalation:
  → VIVIM Dispute Board (mediation)
  → External arbitration (binding)

Type 2: UNAUTHORIZED_ACCESS
─────────────────────────────
Description: One party accessed data beyond their scope

Auto-Resolution:
  (a) Automatic access suspension
  (b) Immediate notification to aggrieved party
  (c) Full audit log export to aggrieved party

Escalation:
  → VIVIM Dispute Board (emergency hearing)
  → Potential contract termination

Type 3: CONTRACT_INTERPRETATION
─────────────────────────────────
Description: Parties disagree on what the contract allows

Auto-Resolution:
  (a) Contract clause review
  (b) Plain language interpretation
  (c) Precedent analysis from similar contracts

Escalation:
  → VIVIM Dispute Board (interpretive ruling)
  → External arbitration (definitive ruling)

Type 4: TERMINATION_DISPUTE
─────────────────────────────
Description: One party wants to exit, other disagrees

Auto-Resolution:
  (a) 30-day transition period
  (b) Data partitioning proposal
  (c) Asset valuation

Escalation:
  → VIVIM Dispute Board (partitioning decision)
  → External arbitration (if partitioning contested)

Type 5: COMMERCIAL_DISAGREEMENT
─────────────────────────────────
Description: Disagreement on commercial exploitation or revenue

Auto-Resolution:
  (a) Revenue calculation audit
  (b) Market rate analysis
  (c) Proposed split adjustment

Escalation:
  → VIVIM Dispute Board (commercial mediation)
  → External arbitration (financial binding)

═══════════════════════════════════════════════════════════
VIVIM DISPUTE BOARD COMPOSITION
═══════════════════════════════════════════════════════════

The VIVIM Dispute Board consists of:

1. HUMAN REPRESENTATIVES (50%)
   - Selected from VIVIM governance participants
   - Trained in data sovereignty principles
   - Rotating membership

2. AI MEDIATION SYSTEM (25%)
   - Trained on contract law and precedent
   - Objective analysis of contract terms
   - Conflict pattern recognition

3. NEUTRAL THIRD PARTIES (25%)
   - Legal professionals with data law expertise
   - No affiliation with either party
   - Vetted for conflicts of interest

DECISION-MAKING:
  - Simple majority for non-binding recommendations
  - Supermajority (70%) for binding interim measures
  - Unanimous for contract modification recommendations

═══════════════════════════════════════════════════════════
ON-CHAIN DISPUTE MECHANISMS
═══════════════════════════════════════════════════════════

When dispute is filed:

1. FUNDS ESCROW
   └─> Smart contract locks any commercial revenue
   └─> Released only per dispute resolution outcome

2. ACCESS SUSPENSION (if needed)
   └─> Smart contract can suspend specific access rights
   └─> Both parties notified immediately

3. EVIDENCE DEPOSIT
   └─> Both parties submit evidence on-chain
   └─> Immutable, timestamped, cryptographically signed

4. TIMELINE ENFORCEMENT
   └─> Automatic reminders at each deadline
   └─> Automatic escalation if deadlines missed
```

---

# Chapter 5: Consent Management System

## Purpose

The **consent registry** tracks all consents — given, denied, pending, and expired — ensuring both parties always know where they stand.

## Consent State Machine

```
CONSENT STATE MACHINE

┌─────────────────────────────────────────────────────────────────────────┐
│                         CONSENT LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌─────────────┐                                                      │
│    │   PENDING   │                                                      │
│    │  (Created) │                                                      │
│    └──────┬──────┘                                                      │
│           │                                                             │
│     ┌─────┴─────┬────────────────┐                                     │
│     │           │                │                                     │
│     ▼           ▼                ▼                                     │
│ ┌─────────┐ ┌─────────┐    ┌─────────────┐                             │
│ │ APPROVED│ │ REJECTED│    │   EXPIRED   │                             │
│ └────┬────┘ └────┬────┘    └──────┬──────┘                             │
│      │           │                 │                                     │
│      │           │                 │                                     │
│      ▼           ▼                 ▼                                     │
│ ┌─────────┐ ┌─────────┐      ┌───────────┐                              │
│ │ ACTIVE  │ │ REVOKED │      │ EXECUTED  │                              │
│ │(Valid)  │ │(Withdrawn)     │(Complete) │                              │
│ └────┬────┘ └────┬────┘      └─────┬─────┘                              │
│      │           │                 │                                     │
│      │           │                 │                                     │
│      ▼           ▼                 ▼                                     │
│ ┌─────────────────────────────────────────┐                             │
│ │            TERMINAL STATES              │                             │
│ │   Completed | Revoked | Expired | Void  │                             │
│ └─────────────────────────────────────────┘                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

State Transitions:

PENDING → APPROVED: Other party consents
PENDING → REJECTED: Other party denies
PENDING → EXPIRED: Response window elapsed
PENDING → VOIDED: Request withdrawn by requester

ACTIVE → REVOKED: Consent withdrawn by granter
ACTIVE → EXPIRED: Consent duration elapsed
ACTIVE → EXECUTED: Consent used for operation

REJECTED → EXPIRED: Auto-cleanup after period
REVOKED → TERMINAL: No further actions possible
EXECUTED → TERMINAL: Consent fully consumed (if one-time use)
```

## Consent Record Schema

```
CONSENT RECORD SCHEMA

{
  "consent_id": "con_7f3a...c2d1",
  "contract_id": "0x7f3a...b2c1",  // Joint custody contract
  "created_at": "2025-01-15T10:30:00Z",
  
  "requester": {
    "did": "did:example:corp",
    "role": "third_party",
    "requested_via": "api"  // or "app", "contract_auto"
  },
  
  "granter": {
    "did": "did:vivim:human:a3f8...c2d1",
    "role": "primary_custodian",
    "response_due_by": "2025-01-18T10:30:00Z"
  },
  
  "request": {
    "action_type": "AI_TRAINING_ACCESS",
    "scope": {
      "data_categories": ["project_alpha", "research_notes"],
      "data_percentage": 35,  // % of joint vault
      "duration_days": 90,
      "model_identifier": "gpt-5-corp-internal",
      "derivative_work_allowed": true,
      "commercial_use_allowed": false
    },
    "justification": "Training model for internal project management",
    "supporting_evidence": ["ipfs://QmXx...Yy"]
  },
  
  "state": {
    "current": "pending",  // pending | approved | rejected | expired | revoked
    "history": [
      {
        "state": "pending",
        "at": "2025-01-15T10:30:00Z",
        "by": "system"
      }
    ]
  },
  
  "response": {
    // Populated when granter responds:
    "decision": null,  // approve | reject
    "reason": null,
    "conditions": null,  // Array of additional conditions
    "responded_at": null,
    "signature": null
  },
  
  "execution": {
    // Populated when consent is used:
    "executed_at": null,
    "operations": [],  // What was done with this consent
    "expiry_check": null  // If one-time use
  },
  
  "blockchain": {
    "created_tx": "0x...",
    "response_tx": null,
    "expiry_tx": null,
    "revocation_tx": null
  }
}
```

---

# Chapter 6: Notification & Alert System

## Purpose

Ensures both parties are always informed of relevant events — consent requests, access logs, contract changes, and disputes.

## Notification Types

```
NOTIFICATION MATRIX

┌─────────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION REQUIREMENTS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  EVENT TYPE              │ CHANNEL      │ TIMING      │ RECIPIENT       │
│  ─────────────────────────────────────────────────────────────────────  │
│  Consent Request         │ Push + Email │ Immediate   │ Granter only    │
│  Consent Approved       │ Push + Email │ Immediate   │ Requester       │
│  Consent Rejected        │ Push + Email │ Immediate   │ Requester       │
│  Consent Expiring Soon   │ Push         │ 24hr before │ Granter         │
│  Data Accessed           │ Log only     │ Batch daily │ Owner (audit)    │
│  New Joint Data Added    │ Push         │ Immediate   │ Both parties    │
│  Contract Modified      │ Push + Email │ Immediate   │ Both parties    │
│  Dispute Filed          │ Push + Email │ Immediate   │ Both parties    │
│  Dispute Resolved       │ Push + Email │ Immediate   │ Both parties    │
│  Access Revoked         │ Push + Email │ Immediate   │ Affected party  │
│  Unusual Access Pattern │ Push + Email │ Immediate   │ Both parties    │
│  Contract Expiring      │ Push         │ 30 days bef │ Both parties    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

Notification Preferences (per user):

{
  "channels": {
    "push": true,
    "email": true,
    "sms": false,
    "in_app": true
  },
  "urgency_levels": {
    "consent_requests": "high",
    "access_alerts": "medium", 
    "routine_logs": "low",
    "disputes": "critical"
  },
  "digest_frequency": {
    "low_urgency": "daily_digest",
    "high_urgency": "immediate"
  },
  "quiet_hours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00",
    "timezone": "America/Los_Angeles",
    "emergency_override": true
  }
}
```

---

# Chapter 7: Audit & Compliance Layer

## Purpose

Complete, immutable logging of all operations for accountability, legal evidence, and compliance verification.

## Audit Event Schema

```
AUDIT EVENT SCHEMA

{
  "event_id": "evt_9z2x...w7y6",
  "contract_id": "0x7f3a...b2c1",
  
  "timestamp": "2025-01-15T15:32:45.123Z",
  "block_number": 18543234,
  "tx_hash": "0xa1b2c3...",

  "actor": {
    "did": "did:example:corp",
    "role": "third_party",
    "authenticated_via": "did_auth",
    "ip_address_hash": "sha256:...",  // Hashed for privacy
    "device_fingerprint_hash": "sha256:..."
  },

  "operation": {
    "type": "CONSENT_APPROVED",
    "target_type": "consent_request",
    "target_id": "req_7f3a...9z2",
    "details": {
      "conditions": ["internal_only", "no_commercial", "audit_rights"],
      "scope_hash": "sha256:..."  // Hash of scope details
    }
  },

  "authorization": {
    "required": true,
    "source": "smart_contract",
    "contract_rule": "unanimous_consent_required",
    "verified": true
  },

  "data_affected": {
    "acus_accessed": [],
    "acus_modified": [],
    "acus_created": []
  },

  "compliance": {
    "jurisdiction": "US-CA",
    "regulation": ["GDPR-ART6", "CCPA"],
    "lawful_basis": "contract",
    "data_category": "collaborative_work"
  },

  "immutability": {
    "merkle_root": "sha256:...",
    "previous_event": "evt_8y1z...v6x5",
    "chain_verified": true
  }
}
```

---

# Chapter 8: Data Partitioning & Exit Protocol

## Purpose

When joint custody ends — through mutual agreement, unilateral exit, or dispute resolution — this protocol governs the fair partitioning of data.

## Exit Scenarios

```
EXIT SCENARIO MATRIX

┌─────────────────────────────────────────────────────────────────────────┐
│                         EXIT SCENARIOS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCENARIO 1: MUTUAL PEACEFUL EXIT                                       │
│  ══════════════════════════════════                                    │
│  Both parties agree to dissolve the custody                             │
│                                                                          │
│  Process:                                                                │
│  1. Joint decision to terminate (unanimous)                            │
│  2. 30-day transition period                                           │
│  3. Data partitioning proposal                                        │
│  4. Human receives primary custody of all data                         │
│  5. 3P receives encrypted mirror (no governance rights)               │
│  6. All derivative agreements terminated                               │
│                                                                          │
│  Data Split:                                                             │
│  • Original contributions return to original creators                  │
│  • Co-created data: Human receives primary, 3P gets copy                │
│  • 3P loses all access rights post-transition                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCENARIO 2: UNILATERAL EXIT (PENALTY)                                  │
│  ═════════════════════════════════════════                             │
│  One party wants to exit, other does not agree                         │
│                                                                          │
│  Process:                                                                │
│  1. Exiting party submits exit request                                 │
│  2. 30-day objection period                                            │
│  3. If no agreement: Automatic arbitration                             │
│  4. Arbitration determines exit terms                                  │
│                                                                          │
│  Penalties (contract may specify):                                      │
│  • Financial penalty to aggrieved party                                │
│  • Reduced share of any commercial value                               │
│  • Loss of rights to specific data categories                           │
│  • Possible reputational scoring impact                                 │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCENARIO 3: TERMINATION FOR CAUSE                                      │
│  ════════════════════════════════════════                              │
│  Material breach by one party                                          │
│                                                                          │
│  Grounds:                                                                │
│  • Unauthorized access                                                  │
│  • Violation of contract terms                                          │
│  • Insolvency/bankruptcy                                                │
│  • Legal order                                                          │
│                                                                          │
│  Process:                                                               │
│  1. Non-breaching party files termination                              │
│  2. Evidence submitted to VIVIM Dispute Board                         │
│  3. Emergency hearing (72 hours)                                       │
│  4. If breach confirmed: Immediate termination                        │
│  5. Breaching party may lose all rights                                │
│  6. Possible damages awarded to non-breaching party                   │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SCENARIO 4: AUTOMATIC TERMINATION                                      │
│  ═════════════════════════════════════                                  │
│  Contract-specified automatic triggers                                 │
│                                                                          │
│  Triggers:                                                              │
│  • Project completion date (if time-limited)                           │
│  • Company dissolution                                                  │
│  • Employment termination (for work-product vaults)                    │
│  • User death/incapacity (with designated heirs)                       │
│                                                                          │
│  Process:                                                               │
│  1. Automatic detection of trigger condition                           │
│  2. Notification to all parties                                        │
│  3. Standard exit protocol (Scenario 1)                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# Chapter 9: The Third-Party Determinant — Full Integration

## Putting It All Together

```
THIRD-PARTY DETERMINATION → JOINT CUSTODY FLOW

┌─────────────────────────────────────────────────────────────────────────┐
│                     COMPLETE DETERMINATION FLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: DATA CREATION                                                  │
│  ════════════════════                                                    │
│                                                                          │
│  User creates data in VIVIM                                             │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              THIRD-PARTY DETERMINANT ENGINE                      │   │
│  │                                                                   │   │
│  │  Questions asked:                                                 │   │
│  │  • Does this involve a third party?                             │   │
│  │  • Is this work-for-hire?                                       │   │
│  │  • Does it contain third-party IP?                             │   │
│  │  • Did a third party contribute?                                │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│         │                                                                │
│         ├────────────────────────────────┐                              │
│         │                                │                              │
│         ▼                                ▼                              │
│  ┌─────────────────┐            ┌─────────────────┐                     │
│  │ SOLE OWNERSHIP  │            │ THIRD-PARTY     │                     │
│  │                 │            │ INTEREST        │                     │
│  │ • No change     │            │ DETECTED        │                     │
│  │ • Human keeps   │            │                 │                     │
│  │   100% control  │            │ Proceed to      │                     │
│  │                 │            │ Classification   │                     │
│  └─────────────────┘            └─────────────────┘                     │
│                                       │                                 │
│                                       ▼                                 │
│  STEP 2: CLASSIFICATION                                       │
│  ════════════════════                                                 │
│                                       │                                 │
│  ┌────────────────────────────────────┴────────────────────────────┐   │
│  │                    CLASSIFICATION ENGINE                         │   │
│  │                                                                  │   │
│  │   Tier 1: Joint Creation?          → JOINT CUSTODY (50/50)      │   │
│  │   Tier 2: Employer-Derived?        → JOINT CUSTODY (70/30)      │   │
│  │   Tier 3: Third-Party IP?         → LICENSE CONTRACT            │   │
│  │   Tier 4: Circle-Shared?           → CIRCLE ACCESS               │   │
│  │   Tier 5: Delegated?               → AGENCY CONTRACT              │   │
│  │                                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  STEP 3: CONTRACT DEPLOYMENT                                        │
│  ═══════════════════════════                                         │
│                                       │                                 │
│  For Joint Custody (Tier 1/2):                                        │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                                                                   │   │
│  │   1. Resolve third-party DID                                     │   │
│  │   2. Deploy Joint Custody Smart Contract                         │   │
│  │   3. Generate joint encryption keys (MPC)                         │   │
│  │   4. Create mirrored index for third party                        │   │
│  │   5. Notify both parties                                          │   │
│  │   6. Register in consent registry                                 │   │
│  │   7. Begin audit logging                                          │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                       │                                 │
│                                       ▼                                 │
│  STEP 4: ONGOING GOVERNANCE                                        │
│  ═══════════════════════════                                         │
│                                       │                                 │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    GOVERNANCE RULES ACTIVE                        │   │
│  │                                                                   │   │
│  │   All actions governed by smart contract:                        │   │
│  │                                                                   │   │
│  │   • Read: Either party can read (individually)                   │   │
│  │   • Modify: BOTH parties must consent                           │   │
│  │   • Delete: BOTH parties must consent                           │   │
│  │   • Share: BOTH parties must consent                             │   │
│  │   • Train: BOTH parties must consent + contract terms            │   │
│  │   • Exit: Either party (with penalties) or both (peacefully)     │   │
│  │                                                                   │   │
│  │   Audit trail: Every operation logged on-chain                    │   │
│  │   Notifications: Both parties informed of all material events     │   │
│  │   Disputes: Escalation to VIVIM Dispute Board if needed          │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# Summary: Top-Level Requirements

## Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | System must automatically detect third-party ownership interest at point of data creation | Critical |
| FR-2 | System must classify ownership into defined tiers (0-5) with clear governance rules | Critical |
| FR-3 | System must deploy joint custody smart contracts for Tier 1 and Tier 2 data | Critical |
| FR-4 | Joint custody contracts must enforce 50/50 veto for all material changes | Critical |
| FR-5 | Third-party integration API must support full consent workflow | High |
| FR-6 | System must maintain immutable audit trail for all joint vault operations | High |
| FR-7 | System must support automated dispute resolution escalation | High |
| FR-8 | System must support graceful exit with data partitioning | Medium |
| FR-9 | Notification system must inform both parties of all material events | Medium |
| FR-10 | System must support multiple simultaneous joint custody contracts | Medium |

## Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Determination latency | < 100ms per ACU |
| NFR-2 | Smart contract execution | < 2s for consent operations |
| NFR-3 | Audit trail write | < 50ms (async batched) |
| NFR-4 | API availability | 99.9% uptime |
| NFR-5 | Data encryption | AES-256-GCM, post-quantum ready |
| NFR-6 | Key management | MPC for joint keys, HSM for individual |
| NFR-7 | Jurisdictional compliance | GDPR, CCPA, and growing |

## Security Requirements

| ID | Requirement |
|----|-------------|
| SR-1 | No single party can access joint data without proper consent |
| SR-2 | All consent must be cryptographically signed |
| SR-3 | All operations must be logged immutably |
| SR-4 | Joint keys must be generated via MPC (neither party has full key) |
| SR-5 | Third-party authentication must use W3C DID standard |

---

# Next Steps — Deep Dive Chapters

This blueprint provides the top-level architecture. Each chapter warrants detailed design:

1. **Chapter 1 (Detailed)**: Third-Party Determinant — ML classifiers, signal weighting, false positive management
2. **Chapter 2 (Detailed)**: Joint Custody Smart Contract — Full code specification, upgrade mechanisms, oracle integration
3. **Chapter 3 (Detailed)**: Third-Party API — Authentication flows, rate limiting, error handling
4. **Chapter 4 (Detailed)**: Dispute Resolution — AI mediation system, arbitration protocols, enforcement
5. **Chapter 5 (Detailed)**: Consent Management — State machine implementation, expiration logic, revocation cascade
6. **Chapter 6 (Detailed)**: Notification System — Multi-channel delivery, preference management, escalation
7. **Chapter 7 (Detailed)**: Audit Layer — Merkle tree implementation, chain bridging, evidence export
8. **Chapter 8 (Detailed)**: Exit Protocol — Data partitioning algorithms, penalty calculations, chain of custody

---

*Shall we proceed with a deep dive into any specific chapter?*S
