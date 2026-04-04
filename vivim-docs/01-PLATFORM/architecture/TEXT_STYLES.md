# OpenScroll Text Styles Registry
**Formal Definition of Presentation Modifiers**

**Date:** January 29, 2026
**Context:** Atomic Chat Unit (ACU) Parsing & Rendering

---

## 1. Overview
This document defines the **Text Styles** available within the OpenScroll ecosystem. While **Types** define *what* the data is, **Styles** define *how* it is emphasized or decorated.

Styles are typically applied **inline** to ranges of text within a Prose or List item ACU. They do not usually warrant creating a separate ACU, but are stored as metadata (spans) within the content.

---

## 2. Typographic Styles

### 2.1 Weight & Emphasis
*   **Bold / Strong:**
    *   *Markdown:* `**text**` or `__text__`
    *   *Semantics:* Heavy emphasis, key terms, UI elements.
*   **Italic / Emphasis:**
    *   *Markdown:* `*text*` or `_text_`
    *   *Semantics:* Variable names, book titles, foreign words, gentle emphasis.
*   **Bold Italic:**
    *   *Markdown:* `***text***` or `___text___`
    *   *Semantics:* Intense emphasis.

### 2.2 Decoration
*   **Strikethrough:**
    *   *Markdown:* `~~text~~`
    *   *Semantics:* Deleted information, corrections, sarcasm.
*   **Underline:**
    *   *Markdown:* Not standard (often `<u>` HTML).
    *   *Semantics:* Links (default), critical emphasis.
*   **Highlight / Mark:**
    *   *Markdown:* `==text==` (extended syntax).
    *   *Semantics:* Visual highlighting (yellow background).

### 2.3 Scripting
*   **Superscript:**
    *   *Markdown:* `^text^` (extended) or `<sup>` HTML.
    *   *Usage:* Footnotes `[1]`, mathematical powers `x^2`, ordinal numbers `1st`.
*   **Subscript:**
    *   *Markdown:* `~text~` (extended) or `<sub>` HTML.
    *   *Usage:* Chemical formulas `H2O`, mathematical indices `x_i`.

### 2.4 Monospace (Inline Code)
*   **Style:** `text` (backticks).
*   **Semantics:** Code literals, file paths, keystrokes, technical terms.
*   *Note:* While defined as a "Type" in the Types registry, it acts as a Style when used inline within a prose sentence.

---

## 3. Structural Styles (Block Level)

### 3.1 Headers (Hierarchy)
*   **Levels:** H1 (`#`) through H6 (`######`).
*   **Semantics:** Document structure, sectioning.
*   **ACU Implication:** Headers often trigger the start of a new semantic grouping.

### 3.2 Thematic Breaks
*   **Visual:** Horizontal Rule (`---`, `***`).
*   **Semantics:** Strong topic shift or section end.

### 3.3 Color (Provider Specific)
*   **Definition:** Text rendered in specific colors (e.g., Red for errors, Green for success).
*   **Source:** Often encoded via LaTeX `\textcolor{red}{...}` or HTML spans in rich captures.
*   **Handling:** Must be sanitized and mapped to theme-aware colors in the app (e.g., "Error Red" vs "Dark Mode Red").

---

## 4. Implementation Specification

### 4.1 Storage (The Span Model)
Instead of storing HTML/Markdown strings directly in the database (which makes search hard), we recommend a **Span-based** approach for complex styling, though Markdown text is the primary storage format.

**Markdown Storage (Simple):**
Store the raw markdown: `"This is **bold** text."`

**Span Object (Complex/Rich):**
```rust
struct StyledSpan {
    start: usize,
    end: usize,
    styles: Vec<StyleFlag>,
}

enum StyleFlag {
    Bold,
    Italic,
    Strike,
    Code,
    Color(HexCode),
}
```

### 4.2 Rendering Rules
*   **Normalization:** Convert provider-specific quirks (e.g., `\textbf{}` in LaTeX) to standard Markdown (`**`) during the Decomposition phase.
*   **Accessibility:** Ensure styles map to semantic HTML (e.g., `<strong>`, `<em>`) for screen readers.
