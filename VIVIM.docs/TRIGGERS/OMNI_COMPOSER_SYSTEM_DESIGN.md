
## 7. Data Model Integration (Prisma)

The Omni-Composer relies on the following database models defined in `schema.prisma`.

### 7.1. `@` Mentions (Social & Personas)

-   **`User`**: Represents human users in the system.
-   **`AiPersona`**: Represents AI agents and system personas.
    -   `trigger`: The shortcode used for summoning (e.g., "tutor" for `@tutor`).
    -   `type`: Distinguishes between "mode", "clone", and "agent".
    -   `systemPrompt`: Defines the behavior when this persona is active.

### 7.2. `#` Topics (Knowledge Graph)

-   **`AtomicChatUnit`**: The primary target for topic linking.
    -   `content`: searchable text.
    -   `tags`: Array of string hashtags for quick lookup.
    -   `embedding`: Vector data for semantic similarity search.
    -   `rediscoveryScore`: Used to rank suggestions.

### 7.3. `+` Context (Data Injection)

-   **`UserFact`**: Stores atomic facts about the user.
    -   `category`: e.g., "bio", "preference".
    -   `content`: The actual fact text to inject.

### 7.4. Future Extensions

To support dynamic **Commands (/)** and **Actions (!)** without code changes, the following models are proposed:

```prisma
model SystemCommand {
  id          String   @id @default(uuid())
  trigger     String   @unique // e.g., "clear"
  label       String
  description String?
  actionCode  String   // Internal handler ID
  scope       String   // "global", "chat", "settings"
  
  @@map("system_commands")
}
```
