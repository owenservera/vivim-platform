---
sidebar_position: 3
title: User Context System
---

# User Context System (`UserContextSystem`)

Privacy and system reliability are paramount in VIVIM. Rather than a massive global vector store where one user's database can leak or degrade performance for others, VIVIM runs highly isolated sub-systems.

## Isolated SQLite Vector Stores
Each user gets a dedicated SQLite backend managed asynchronously by `user-database-manager.js`. All real-time, live user memories, vectors, and contextual fragments (ACUs) live inside these siloed states.

### `UserContextSystem` Class Responsibilities
1. **Lifecycle hooks**: `initialize()`, `disconnect()` handle the DB connections per user request gracefully.
2. **Embedding Management**: Local `fallbackEmbedding` and remote AI model vectorization (`generateEmbedding`), keeping external dependency reliance low and isolated.
3. **Store Mutability**: The capability to seamlessly `addToVectorStore` without interrupting the standard Express/Node thread.
4. **Context Compiling**: Methods like `compileContext` that aggregate standard isolated memory metrics natively instead of requiring higher level orchestrators to pull manually.

## Usage Model

```javascript
import { getUserContextSystem } from '../lib/user-database-manager.js';

// Accessing the isolated backend
const sys = await getUserContextSystem(userId);
const searchResults = await sys.searchVectorStore(query, 10);
```

By keeping these systems completely decoupled, scaling vertically or migrating user profiles to new data models becomes completely frictionless.
