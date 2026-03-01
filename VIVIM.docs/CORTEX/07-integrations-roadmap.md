# VIVIM Cortex — Integrations Roadmap

> Expanding Cortex from an "AI chat memory" to the
> **Universal Sovereign Memory Layer** for the enterprise.

---

## The Cortex Integration Philosophy

Most AI integrations are "Search & RAG" — they ingest millions of raw documents and try to retrieve them later. This results in bloated vector stores, irrelevant search results, and massive compute costs.

**Cortex does NOT do bulk indexing. Cortex does Semantic Extraction.**

When we integrate with Slack, we don't index every "sounds good" message. We listen to channels, wait for a thread to resolve, and extract the *conclusion* or *decision* as a distinct Memory Object. 

**Integration Types:**
1. **Source Providers:** Where conversations happen (AI models, Slack, Email). We *extract* memories from here.
2. **Context Consumers:** Where work gets done (IDE, GitHub, Notion). We *inject* context here.
3. **Systems of Record:** Where truth lives (Salesforce, Jira). We *sync* formal state with memory state.

---

## Phase 1: The Personal AI Sphere (MVP)

*Goal: Make the user's personal AI usage fully portable across all models.*

### Core AI Providers
The foundational integrations. Cortex sits as a transparent proxy or browser extension, capturing text before it hits the provider APIs.

- **OpenAI (ChatGPT / API)**
  - *Extracts:* Coding preferences, project context, writing style.
  - *Context injection:* Prepends optimized CortexKnapsack context to system prompts.
- **Anthropic (Claude)**
  - *Extracts:* Deep analysis conclusions, complex architecture decisions.
  - *Status:* High priority due to developer overlap.
- **Google (Gemini)**
  - *Extracts:* Workspace research, general queries.
- **Local Models (Ollama, LM Studio)**
  - *Extracts:* Highly sensitive private queries.
  - *Advantage:* Runs entirely local; no cloud transit required.

### Personal Productivity
- **Apple Notes / Obsidian / Notion (Personal)**
  - *Extracts:* Explicitly created knowledge, journal entries, goals.
  - *Method:* Background sync of specific tags (e.g., `#cortex`).

---

## Phase 2: High-Signal SaaS (Team & Enterprise)

*Goal: Move from single-user personal memory to shared team intelligence without bulk-indexing junk.*

### Async Communication
- **Slack / Microsoft Teams**
  - *The problem:* 95% of messages are transient noise.
  - *The Cortex approach:* 
    1. Listen to channels via Event API.
    2. When a thread reaches >N replies and halts, trigger extraction.
    3. LLM evaluates: "Was a decision made here? Was a fact established?"
    4. If yes, extract ONE memory: *"Decision (Feb 12): Team chose Postgres over MySQL due to JSONB support."*
    5. Discard the raw thread.

### Code & Engineering
- **GitHub / GitLab**
  - *Extracts:* PR descriptions, architecture decisions in issues, code review feedback.
  - *Memory Type:* `PROCEDURAL` and `PROJECT`.
  - *Example Memory:* *"User consistently requests strict TypeScript typing in reviews (PR #452)."*
- **Linear / Jira**
  - *Extracts:* Epic goals, shifting deadlines, task blockers.
  - *Integration point:* Webhook on issue transition (e.g., In Progress → Done).

### Documentation
- **Notion / Confluence (Enterprise)**
  - *Extracts:* Official team guidelines, onboarding checklists, product requirements.
  - *Memory Type:* `FACTUAL` and `SEMANTIC`.
  - *Sync logic:* CRDT-based bidirectional link. If the source Notion doc changes, the extracted memories are re-evaluated for contradictions.

---

## Phase 3: Systems of Record (Revenue & Operations)

*Goal: Bridge the gap between unstructured conversation and structured databases for Go-To-Market teams.*

### Customer Relationship Management (CRM)
- **Salesforce / HubSpot**
  - *The Cortex approach:* Sales reps hate data entry. Cortex listens to Zoom/Gong calls (via transcripts) and emails, extracts the facts, and saves them as Cortex Memories.
  - *Sync out:* Cortex periodically suggests updates to the CRM fields based on accumulated memories (e.g., "M1: Client mentioned budget is $50k. Update Salesforce 'Amount' field?").
  - *Memory Type:* `RELATIONSHIP` and `FACTUAL`.

### Customer Support
- **Zendesk / Intercom**
  - *Extracts:* Recurring user issues, successful troubleshooting paths, feature requests.
  - *Context injection:* When an agent opens a ticket, Cortex assembles context: "You solved a similar issue for Acme Corp last month using this specific workaround."

### Video Conferencing
- **Zoom / Gong / Fireflies**
  - *Extracts:* Meeting action items, sentiment, decisions.
  - *Flow:* Transcript webhook → Cortex Extraction Engine → Memories tagged with meeting participants.

---

## Phase 4: Data Infrastructure & Bulk Ingestion

*Goal: Make CortexDB the intelligence layer for enterprise data lakes.*

If an enterprise *insists* on bulk indexing historical data, we support it via batched extraction pipelines.

- **Airbyte / Fivetran**
  - *Integration:* Cortex destination connector.
  - *Process:* Routes incoming raw data through an extraction cluster (e.g., local vLLM instances) to distill petabytes of raw logs/docs into gigabytes of high-signal memories before hitting CortexDB.
- **Snowflake / Databricks**
  - *Integration:* External Function / UDF.
  - *Usage:* Allow SQL queries to directly call CortexDB `RECALL` procedures to enrich tabular data with unstructured memory context.
- **AWS S3 / Google Cloud Storage**
  - *Integration:* EventBridge triggers on file upload.
  - *Process:* PDF/Docx uploaded → parsed → sent to extraction queue → memories generated.

---

## The "Extract-Anywhere" Extensibility Model

To scale to hundreds of integrations without building them all internally, Cortex relies on **Memory Extraction Schemas (MES)**.

Partners or open-source contributors write a simple JSON schema defining how to extract memories from their app's webhook payload:

```json
{
  "integration": "linear_app",
  "trigger": "issue.completed",
  "extraction_prompt": "Analyze this completed Linear issue. Extract the core technical decision made and the final solution implemented.",
  "mapping": {
    "category": "technical/projects/{{project.name}}",
    "importance": 0.8,
    "tags": ["{{team.key}}", "decision"]
  }
}
```

This extensible architecture turns Cortex into the gravitational center of the enterprise intelligence stack.

---
*Document Version: 1.0 — March 2026*
*Part of: VIVIM Cortex Product Documentation*
