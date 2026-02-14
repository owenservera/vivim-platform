# OpenScroll Cognitive Stream: Data-Driven Context Architecture
**Target Model:** z.ai glmt-4.7
**Philosophy:** Fluid Taxonomy, Event-Driven Evolution

## 1. The Core Concept: "The Cognitive Diff"
Instead of fitting data into a rigid rubric (e.g., "Always fill out these 5 fields"), the system allows the data to shape the structure.
We treat Context as a **Living Graph**. When new ACUs (Atomic Chat Units) arrive, `glmt-4.7` analyzes the *delta* between what we *knew* and what we *just heard*, then issues **Graph Mutations**.

### The Three Loops
1.  **The Hot Loop (Real-time):** Context retrieval for the current response. (Milliseconds).
2.  **The Warm Loop (Session-based):** Updating the "Conversation Arc" (L4) and "Entity States" (L3). (Seconds/Minutes).
3.  **The Cold Loop (Consolidation):** `glmt-4.7` waking up to merge fragmented memories into "Identity" (L0) or "Deep Topics" (L2). (Async/Scheduled).

---

## 2. Architecture Components

### 2.1 The Trigger: `SignalAccumulator`
We don't want to burn expensive inference on every "Hello".
*   **Role:** Buffers incoming ACUs.
*   **Trigger Condition:** 
    *   Buffer > 500 tokens OR
    *   Conversation ended OR
    *   "High Entropy" detected (e.g., user says "I want to change how we work").

### 2.2 The Brain: `ContextEvolver` (powered by `glmt-4.7`)
This is the worker agent. It receives:
1.  The **New Data** (Buffered ACUs).
2.  The **Relevant Graph Slice** (Existing Topics/Entities related to this data).
3.  **The Mandate:** "Reconcile this."

### 2.3 The Tooling: `GraphMutator`
A strict interface that `glmt-4.7` calls to modify the database. It prevents the LLM from hallucinating database schemas.
*   `createTopic(slug, description)`
*   `mergeEntities(sourceId, targetId, reason)`
*   `upgradeMemory(acuIds, newInsight, layer: 'L0' | 'L2')`
*   `deprecateFact(factId, reason)`

---

## 3. The `glmt-4.7` Process Flow

### Step 1: Semantic Triage (Input Processing)
**Input:** Incoming ACUs + User's current L0 (Identity).
**Prompt:**
> "Analyze this stream. Does it reinforce existing beliefs, contradict them, or introduce new domains?
> 1. Identify active Entities (People, Tech, Projects).
> 2. Detect Shift in Intent (e.g., User moved from 'Learning' to 'Building')."

### Step 2: Dynamic Layer Generation (The "On-the-Fly" logic)
Instead of static layers, `glmt-4.7` determines which layers are *active*.

#### **L7 -> L3 (Entity Extraction)**
If the user talks about "Project X", `glmt-4.7` checks if "Project X" exists.
*   **If Yes:** It appends the new facts to the existing profile.
*   **If No:** It creates a new `EntityProfile` dynamically.

#### **L4 -> L2 (Topic Crystallization)**
If the user spends 30 messages discussing "Hydroponics", `glmt-4.7` notices the density.
*   **Action:** It promotes the ephemeral L4 (Conversation History) into a durable L2 (Topic Profile: Hydroponics).
*   **Mutation:** `createTopic('hydroponics', 'User is experimenting with DWC systems...')`.

#### **L2 -> L0 (Identity Consolidation)**
If a pattern repeats across multiple Topics, it moves to Identity.
*   *Observation:* User mentions "I prefer TypeScript" in the "React" topic and "I hate Python" in the "Backend" topic.
*   *Synthesis:* `glmt-4.7` calls `upgradeMemory` to write to L0: "User has a strong preference for Static Typing."

---

## 4. Implementation Specification

### 4.1 The `ContextEvolutionService`
Located at `@server/src/services/context-evolution.ts`.

```typescript
interface EvolutionRequest {
  bufferId: string;
  acus: AtomicChatUnit[];
  userId: string;
}

class ContextEvolutionService {
  async evolve(req: EvolutionRequest) {
    // 1. Fetch 'Neighborhood' (Similiar ACUs/Entities)
    const neighborhood = await this.vectorStore.search(req.acus);
    
    // 2. Call GLMT-4.7
    const mutations = await this.llm.generateMutations({
      model: 'z.ai-glmt-4.7',
      systemPrompt: DYNAMIC_EVOLUTION_PROMPT,
      data: { new: req.acus, old: neighborhood }
    });
    
    // 3. Execute Mutations
    await this.graphMutator.apply(mutations);
    
    // 4. Invalidate Bundles (Trigger re-compile for next chat)
    await this.orchestrator.invalidateAffected(mutations);
  }
}
```

### 4.2 The "Dynamic Prompt" Strategy
We don't use one prompt. We use a **Recursive Prompt Chain**.

**Phase 1: Significance Filter**
> "Is this data worth remembering long-term? If it's just 'chitchat', discard. If it contains facts/preferences/events, extract them."

**Phase 2: Graph Integration**
> "Here is the new fact: 'User likes Dark Mode'.
> Here is the Graph: { Preference: 'User likes Light Mode' (dated 2024) }.
> **Decision:** Update Preference. Reason: 'User changed preference'."

---

## 5. Long-Term Memory Storage (The Graph)

To support this, we modify the Schema slightly to support **Evolutionary Lineage**.

```prisma
model Memory {
  id          String   @id
  // ... existing fields
  
  // New Fields for Dynamic Evolution
  evolutionChainId  String?  // Links versions of the same memory
  supersededBy      String?  // If this memory was merged/updated
  confidence        Float    // 0.0 - 1.0 (GLMT's confidence in this fact)
  evidenceACUs      String[] // IDs of ACUs that prove this fact
  
  layer       String   // "L0", "L1", "L2", "L3" - dynamic assignment
}
```

## 6. Summary of Flow
1.  **User Chats.** -> Data enters `ACU Table`.
2.  **Accumulator fills.** -> Triggers `ContextEvolutionService`.
3.  **GLMT-4.7 Reads.** -> Compares new ACUs against Vector Store.
4.  **GLMT-4.7 Decides.** -> "This is a new Topic" or "This updates L0 Identity".
5.  **Graph Mutates.** -> DB is updated.
6.  **Next Chat.** -> `BudgetAlgorithm` pulls the *freshly evolved* L0/L2/L3 layers.

This effectively turns the application into a **Learning Organism** rather than a filing cabinet.
