# OpenScroll Text Types Registry
**Formal Definition of Content Primitives**

**Date:** January 29, 2026
**Context:** Atomic Chat Unit (ACU) Parsing & Rendering

---

## 1. Overview
This document formally defines the **Text Types** encountered in AI conversations. A "Type" defines the **semantic structure** and **data format** of a content block. It dictates how the parser detects the unit and how the UI renders it.

Unlike **Styles** (which modify appearance), **Types** fundamentally change the nature of the data.

---

## 2. Core Text Types

### 2.1 Prose (The Default)
*   **Definition:** Standard natural language text.
*   **Detection:** Any text content not matching other specific type patterns.
*   **Properties:** `language` (en, es, etc. - inferred).
*   **Example:** "The quick brown fox jumps over the lazy dog."

### 2.2 Code (Executable/Technical)
*   **Definition:** Source code, shell commands, or technical syntax intended for execution or precise display.
*   **Sub-Types:**
    *   **Inline Code:** Short snippets within prose. (e.g., `let x = 1;`)
    *   **Code Block:** Multi-line, fenced content.
*   **Properties:**
    *   `language`: Programming language identifier (rust, python, bash).
    *   `filename`: Optional file label (e.g., `main.rs`).
    *   `execution_result`: Optional output if the code was run by the provider.

### 2.3 Mathematics (LaTeX)
*   **Definition:** Mathematical notation rendered via KaTeX or MathJax.
*   **Sub-Types:**
    *   **Inline Math:** Embedded in line (e.g., $E = mc^2$).
    *   **Display Math:** Standalone block (e.g., $$ \sum_{i=0}^n i^2 $$).
*   **Format:** LaTeX syntax.

### 2.4 Structured Tables
*   **Definition:** Data arranged in rows and columns.
*   **Format:** Markdown Tables (pipes `|` and dashes `-`).
*   **Properties:** `headers` (list), `alignment` (left/center/right), `rows` (2D array).

### 2.5 Diagrams (Mermaid/Graphviz)
*   **Definition:** Text-based definitions rendered as visual graphs.
*   **Format:** Mermaid syntax (usually inside a code block tagged `mermaid`).
*   **Types:** Flowchart, Sequence, Gantt, Class, State, ER, Pie, Mindmap.

### 2.6 Emojis & Unicode
*   **Definition:** Pictographic symbols treated as semantic markers.
*   **Detection:** Unicode ranges (e.g., U+1F600).
*   **Usage:** Often used by AIs as structural bullets (e.g., "🚀 **Performance**").

### 2.7 Tool Calls / Functions
*   **Definition:** Structured blocks representing the AI invoking an external tool.
*   **Format:** Typically JSON or Python-like syntax specific to the provider.
*   **Properties:** `tool_name`, `arguments`, `status` (running/complete).

### 2.8 Tool Outputs / Results
*   **Definition:** The machine-readable response from a tool call.
*   **Format:** JSON, CSV, or raw logs.
*   **Context:** Linked to a specific Tool Call parent.

### 2.9 Citations / References
*   **Definition:** Markers indicating the source of information.
*   **Formats:**
    *   Standard: `[1]`, `[2]`.
    *   Provider Specific: `【4:0†source】` (ChatGPT search).
*   **Properties:** `source_id`, `url`, `title`.

### 2.10 URIs / Links
*   **Definition:** References to external resources.
*   **Sub-Types:**
    *   **Raw URL:** `https://example.com`
    *   **Hyperlink:** `[Label](URL)`
    *   **Auto-linked:** Email addresses, phone numbers.

### 2.11 Blockquotes / Callouts
*   **Definition:** Text referenced from another source or highlighted for attention.
*   **Sub-Types:**
    *   **Standard Quote:** `> Text`
    *   **Admonition/Callout:** `> [!WARNING] Text` (GitHub Flavored Markdown extension).
*   **Properties:** `type` (note, warning, tip, danger).

### 2.12 Lists (Structured Itemization)
*   **Definition:** Sequenced or non-sequenced collection of items.
*   **Sub-Types:**
    *   **Ordered:** `1.`, `a.`, `i.`
    *   **Unordered:** `-`, `*`, `+`
    *   **Task List:** `- [ ]`, `- [x]`

---

## 3. Parsing Strategy
The TreeSitter parser must be configured to identify these types as distinct nodes in the Abstract Syntax Tree (AST). Each type becomes a candidate for its own **Atomic Chat Unit (ACU)** or a distinct property within an ACU.
