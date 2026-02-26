# ACU Hierarchy & Action State Model
**Formal Definition of Granularity and Behavioral States**

**Date:** January 29, 2026
**Status:** Advanced Concept Definition

---

## 1. The Granularity Hierarchy (Zoom Levels)

The ACU system treats information not as a flat list, but as a "Zoomable Map." An ACU can represent a single fact, or an entire conversation, depending on the **Zoom Level**.

### Level 0: The Universe (Graph Root)
*   **Unit:** `Identity_ACU`
*   **Definition:** The User Node. "Everything I know."
*   **Children:** All Conversation Roots.

### Level 1: The Context (Conversation Root)
*   **Unit:** `Conversation_ACU`
*   **Definition:** A specific session (e.g., "React Native Debugging - Jan 29").
*   **Role:** Container for the full linear log.
*   **Relations:** `HAS_PART` (points to Message Clusters).

### Level 2: The Topic Cluster (Logical Grouping)
*   **Unit:** `Topic_ACU` (Virtual Node)
*   **Definition:** A sequence of messages related to a specific sub-goal (e.g., "Fixing the SSL Error").
*   **Detection:** Heuristic break (Header change) or Vector Cluster boundary.
*   **Children:** Individual Messages.

### Level 3: The Turn (Message Root)
*   **Unit:** `Message_ACU`
*   **Definition:** A single "User Send" or "Assistant Reply."
*   **Role:** Provenance anchor.
*   **Children:** Paragraphs, Code Blocks.

### Level 4: The Atomic Proposition (The Working Unit)
*   **Unit:** `Proposition_ACU`
*   **Definition:** A single standalone thought.
    *   *Example:* "Use `useEffect` to handle side effects."
    *   *Example:* A specific Code Block.
*   **Role:** This is the primary unit for **Search** and **Remixing**.

### Level 5: The Entity / Fact (The Micro-Unit)
*   **Unit:** `Fact_ACU`
*   **Definition:** A specific extracted data point.
    *   *Example:* `User.Birthday = "Jan 29"`
    *   *Example:* `API_Key = "sk-..."`
*   **Special Handling:** These are often **Personal Identifiable Information (PII)** and require higher security (Encryption Level 3).

---

## 2. Action States (The ACU Lifecycle)

An ACU is not static; it has a "Life" defined by its state in the P2P network.

| State | Definition | Access Rights | Persistence |
| :--- | :--- | :--- | :--- |
| **DORMANT** | Raw captured data. Not yet parsed or enriched. | Private (Owner Only) | Disk (SQLite) |
| **ACTIVE** | Parsed, indexed, and vector-embedded. Searchable locally. | Private (Owner Only) | Disk + RAM Index |
| **SHARED_PRIVATE** | Encrypted and synced to specific peers (P2P). | ACL Group (e.g., "Co-Workers") | P2P Swarm |
| **SHARED_PUBLIC** | Published to the DHT. Immutable. | Public (World Readable) | IPFS/DHT |
| **FORKED** | A copy taken by another user for editing. Links back to original. | Fork Owner | Fork Owner's Store |
| **ARCHIVED** | Deprecated or superseded by a newer version. | Read-Only | Cold Storage |

---

## 3. The "Personal" ACU (Level 5 Security)

One of the most critical ACU types is the **Personal Fact**.

### Definition
An ACU that contains sensitive, user-specific truth.
*   *Content:* "My name is Owen." / "My server IP is 10.0.0.1."
*   *Type:* `ACU_PERSONAL_FACT`.

### Special Behaviors
1.  **Auto-Redaction:** When sharing a parent Conversation (Level 1) or Topic (Level 2), any child Level 5 ACUs tagged as `PERSONAL` are **automatically redacted** or encrypted unless explicitly authorized.
2.  **The "Profile" Graph:** All Personal ACUs link back to the Level 0 Identity Node via `DEFINES_IDENTITY` edges. This creates a "User Profile" graph that the AI can query to "Remember" things about you.

---

## 4. Traversing the Graph (Examples)

### Scenario A: "Who is the user?"
*   **Query:** `MATCH (u:Identity)-[:DEFINES_IDENTITY]->(f:Fact)`
*   **Result:** A list of all birthday, name, preference ACUs.

### Scenario B: "How did we solve the bug?"
*   **Query:** `MATCH (topic:Topic {title: "SSL Error"})-[:HAS_PART]->(p:Proposition)`
*   **Result:** A distilled summary of the *solution steps* (Level 4), ignoring the "Hello" and "Thank you" messages (Level 3 fluff).

### Scenario C: "Show history of this code block"
*   **Query:** `MATCH (c:CodeSnippet)<-[:VERSION_OF*]-(original)`
*   **Result:** A lineage showing how User A wrote it, User B fixed a typo, and User A merged the fix.

---

## 5. Formal Rules for P2P Sharing

1.  **The Containment Rule:** Sharing a Level 1 ACU (Conversation) implies sharing all Level 3 and Level 4 children, *unless* they are explicitly excluded (e.g., Personal Facts).
2.  **The Integrity Rule:** You cannot modify a Level 4 ACU inside a Level 1 container without creating a *new version* of the Level 1 container (Merkle Root update).
3.  **The Tombstone Rule:** If a Personal ACU is deleted, it leaves a "Tombstone" ACU in the graph to prevent P2P sync from re-introducing the deleted fact.
