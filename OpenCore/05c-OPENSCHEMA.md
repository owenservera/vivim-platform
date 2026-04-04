# VIVIM — Open Schema Section

## The Statement

Every piece of data VIVIM stores has a schema. Every table, every field, every relationship is documented, open, and auditable.

This is unusual. Most companies guard their schemas like secrets. We publish ours like documentation.

**Because trust requires transparency.**

---

## The Explorer

An interactive section where users can browse the data model.

### The Nine Domains

| Domain | What It Covers | Accent Color |
|--------|----------------|--------------|
| **Core Data** | Conversations, Messages, ACUs | Blue |
| **Identity & Auth** | Users, Devices, Keys | Purple |
| **Social Network** | Friends, Groups, Teams | Green |
| **Memory System** | The 9 memory types | Amber |
| **Context Engine** | Profiles, Bundles, Recipes | Teal |
| **Sharing & Access** | Policies, Grants, Links | Red |
| **Rendering** | Templates, Styles | Indigo |
| **Moderation** | Flags, Rules, Records | Pink |
| **Analytics** | Events, Metrics, Sync | Slate |

---

## Key Models

### The Foundation: ACU (Atomic ChatUnit)

The fundamental unit of VIVIM memory. An ACU contains:

- Unique identifier (DID-anchored)
- Content and embedding
- Memory type (one of 9)
- Classification confidence
- Chain relationships to other ACUs
- Decay score
- Sharing policy

### The Container: Conversation

A conversation is more than messages. It tracks:

- Provider origin (OpenAI, Claude, etc.)
- Content statistics (tokens, code blocks, images)
- Title and tags
- Visibility settings
- Relationships to ACUs and Context Bundles

### The Identity: User

A VIVIM user has:

- DID (decentralized identifier)
- Cryptographic keys
- Device trust levels
- Verification status

---

## Interactive Features

### Domain Sidebar
Click a domain to see its models.

### Model Detail Panel
Click a model to see its fields and relationships.

### Visual Relationships
See how models connect — ACUs link to Conversations, which belong to Users, which have Devices.

### Stats Bar
```
42 Models · 9 Domains · 30+ Enums · 100% Open
```

---

## The Philosophy

This schema is:

- **Open by default** — Every table, every field is documented
- **Self-documenting** — Constraints and relationships embedded
- **Portable** — Exportable to standard formats
- **Auditable** — Every data point has provenance

---

## CTAs

- View Full Schema on GitHub →
- Read the ACU Specification →

---

*Document version: 1.0*
*Purpose: Conceptual specification for Open Schema section*
*Last updated: March 2026*
