# Bridge Document 3: The Autonomous Librarian (GLMT-4.7)
**Focus:** Turning raw ACUs into high-fidelity Long-Term Memory (L0-L3).

## 1. The Autonomous Triage Loop
This is the "Cold Loop" that solves the "Ghost Table" problem by using `glmt-4.7` as a background worker.

### The Trigger
When a conversation state moves to `IDLE` (via `ClientPresence`), trigger the `LibrarianWorker`.

### The Mission
`glmt-4.7` reviews the un-processed ACUs from the session and performs **Graph Synthesis**:
1.  **Topic Promotion:** "I see 5 ACUs about 'Rust Macros'. I will create/update the 'rust-lang' TopicProfile."
2.  **Entity Fact Discovery:** "The user mentioned 'Sarah is moving to Berlin'. I will add this fact to the 'Sarah' EntityProfile."
3.  **Identity Distillation:** "The user repeatedly corrected the AI's CSS. I will update the L0 Identity Core: 'User is highly particular about Tailwind class ordering'."

---

## 2. Dynamic Bundle Compilation
Once the Librarian has updated the Profiles, it marks them `isDirty: true`.
*   The `ContextOrchestrator` sees the dirty flag.
*   It calls `BundleCompiler` to generate the Markdown string.
*   **The Result:** The next time the user types a message, the `DynamicContextAssembler` has a pre-built, high-fidelity Markdown block ready to inject instantly.

## 3. The "Memory Stream" Schema
To link the Librarian to the context engine, we use the `composition` JSON field in `ContextBundle` to track exactly which `ACU_IDs` were used. If any of those ACUs are edited or deleted, the bundle is automatically invalidated.
