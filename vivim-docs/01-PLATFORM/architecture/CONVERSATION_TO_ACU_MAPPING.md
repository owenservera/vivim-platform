# L0 to L1: Mapping Conversations to Atomic Chat Units
**Formal Definition & Decomposition Logic**

**Date:** January 29, 2026
**Status:** Architecture Specification

---

## 1. The L0 Primitive: The `CONVERSATION`

The `CONVERSATION` is the raw, immutable artifact captured from the external provider (ChatGPT, Claude, etc.). It is the "Ground Truth." It represents a specific interaction session between a User and an AI.

### 1.1 Formal Definition

A `CONVERSATION` is a **chronologically ordered, linear sequence of Messages**, bounded by a specific context and provider session.

```rust
struct Conversation {
    // Identity
    id: Uuid,                   // Internal unique ID
    source_url: String,         // The origin (e.g., chatgpt.com/c/...)
    provider: ProviderType,     // ChatGPT, Claude, etc.
    
    // Metadata
    title: String,
    created_at: DateTime<Utc>,
    captured_at: DateTime<Utc>,
    model_version: Option<String>,
    
    // The Linear Log (L0 Content)
    messages: Vec<Message>,
    
    // Integrity
    content_hash: String,       // SHA-256 of the raw JSON payload
}

struct Message {
    id: Uuid,
    role: Role,                 // User, Assistant, System
    index: usize,               // 0, 1, 2... (Sequence)
    content: String,            // Raw Markdown/Text
    attachments: Vec<Attachment>,
}
```

### 1.2 Characteristics
1.  **Immutable:** Once captured, the `CONVERSATION` L0 state never changes. Edits happen at the ACU level (L1), not L0.
2.  **Linear:** It strictly follows time (`t0 -> t1 -> t2`).
3.  **Monolithic:** It is often retrieved as a single JSON blob.

---

## 2. The Decomposition Engine (L0 -> L1)

The process of converting a `CONVERSATION` into `ACUs` is called **Decomposition**. This is a **lossless, expanding transformation**. We do not delete the original; we explode it into granular, graph-ready nodes.

### 2.1 The Rules-Based Approach

We use **TreeSitter** (structural) and **Heuristics** (semantic) to map L0 components to L1 ACUs.

#### **Rule #1: The Turn Boundary (Root Split)**
*   **Logic:** Every change in `Role` (User -> Assistant) initiates a new sequence of ACUs.
*   **Result:** A `Message` is the parent container for a batch of ACUs.
*   **Graph Edge:** `ACU[i] --(CHILD_OF)--> Message[j]`

#### **Rule #2: The Code Fence (Atomic Separation)**
*   **Detection:** Markdown fencing (```...```) or indented blocks.
*   **Logic:** Code is functionally distinct from prose. It is often the "Answer" or "Asset."
*   **Action:** Extract the code block into a distinct `ACU` of type `CodeSnippet`.
*   **Context:** The text immediately *preceding* the block is often the "Explanation" and is linked via `EXPLAINS` edge.

#### **Rule #3: The Header Break (Topic Shift)**
*   **Detection:** Markdown Headers (`#`, `##`, `###`).
*   **Logic:** A header explicitly signals a change in sub-topic or a new step in a tutorial.
*   **Action:** Create a new ACU sequence. The Header itself becomes a "Statement" ACU that acts as a parent/grouping node for the section.

#### **Rule #4: The List Item (Proposition Extraction)**
*   **Detection:** Bullet points (`-`, `*`) or Numbered lists (`1.`).
*   **Logic:** Lists are often condensed reasoning or distinct facts.
*   **Action:**
    *   *Short Items (< 1 sentence):* Keep grouped in one "List" ACU.
    *   *Long Items (> 2 sentences):* Split each item into its own `Statement` or `Reasoning` ACU.

#### **Rule #5: The Q&A Pair (Logical Link)**
*   **Detection:** User Message followed immediately by Assistant Message.
*   **Logic:** The User Message ACU(s) form the `Question`. The Assistant Message ACU(s) form the `Answer`.
*   **Graph Edge:** `Assistant_ACU --(ANSWERS)--> User_ACU`.

---

## 3. Mapping Example

**Input (L0 Message Fragment):**
> **User:** How do I read a file in Rust?
>
> **Assistant:** You can use `std::fs`. Here is an example:
> ```rust
> use std::fs;
> fn main() {
>     let data = fs::read_to_string("foo.txt").unwrap();
> }
> ```
> This reads the entire file into a string.

**Output (L1 ACUs):**

| ID | Type | Content | Links |
| :--- | :--- | :--- | :--- |
| **ACU_1** | `Question` | "How do I read a file in Rust?" | `Origin: Msg_0` |
| **ACU_2** | `Statement` | "You can use `std::fs`. Here is an example:" | `Origin: Msg_1`, `ANSWERS: ACU_1` |
| **ACU_3** | `CodeSnippet` | `use std::fs; ...` | `Origin: Msg_1`, `NEXT: ACU_2` |
| **ACU_4** | `Explanation` | "This reads the entire file into a string." | `Origin: Msg_1`, `EXPLAINS: ACU_3` |

---

## 4. Implementation Logic (Pseudo-Code)

This logic resides in the `Rust Parser Engine`.

```rust
fn decompose_conversation(convo: Conversation) -> Vec<ACU> {
    let mut acus = Vec::new();
    
    for message in convo.messages {
        // 1. Create a "Root" ACU for the message (optional, usually virtual)
        
        // 2. Parse Markdown AST (TreeSitter)
        let ast = parser.parse(&message.content);
        
        // 3. Walk the AST
        let mut cursor = ast.walk();
        for node in cursor {
            match node.kind {
                "fenced_code_block" => {
                    let code = extract_text(node);
                    let lang = extract_lang(node);
                    acus.push(ACU::new_code(code, lang, message.id));
                },
                "paragraph" => {
                    let text = extract_text(node);
                    // Check heuristics: Is this a question?
                    let kind = if text.ends_with('?') { AcuType::Question } else { AcuType::Statement };
                    acus.push(ACU::new(text, kind, message.id));
                },
                "list" => {
                    // Recursive breakdown of list items
                    let items = decompose_list(node);
                    acus.extend(items);
                }
                _ => { /* Handle formatting, images, etc. */ }
            }
        }
    }
    
    // 4. Second Pass: Linkage
    // Connect sequential ACUs and establish Q&A links between turns
    link_acus(&mut acus);
    
    return acus;
}
```

---

## 5. Persistence Strategy

While the `CONVERSATION` is stored as a "Cold Archive" (Blob), the `ACUs` are stored in the "Hot Graph" (Nodes & Edges).

*   **Reversibility:** We must be able to reconstruct the approximate view of the L0 Conversation from the L1 ACUs.
*   **Provenance:** Every ACU *must* store the `conversation_id` and `message_index`.

This mapping ensures that as the user captures more conversations, they aren't just piling up logs—they are building a granular, interconnected database of knowledge.
