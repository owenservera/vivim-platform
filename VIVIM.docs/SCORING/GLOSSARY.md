# VIVIM Scoring: Glossary of Terms

### ACU (Atomic Chat Unit)
A single "nugget" of knowledge extracted from a larger AI conversation. Typically a single message or a logically distinct block of content (e.g., a code snippet).

### Content Richness
A metric (0-100) representing how much "variety" is in the content. Measured by word count, use of bold text, links, and code blocks.

### Heavy Ranker
A complex ranking process (often server-side or async) that takes multiple context factors into account.

### Light Ranker
A fast, heuristic-based ranking process (often client-side) used for immediate sorting.

### Network Density
The number of links (`AcuLink`) pointing to or from a specific ACU. High density implies the information is a foundational "hub" in your knowledge base.

### Recency Decay
A mathematical function that reduces the boost granted to an item as it gets older. Prevents the feed from becoming stagnant.

### Structural Integrity
A metric (0-100) representing how "clean" the text is. High scores imply proper formatting and low noise (scraping garbage).

### Zero-Trust Witness
The process in the PWA that re-verifies extraction hashes locally before storing them, ensuring the server hasn't tampered with the content or its score.
