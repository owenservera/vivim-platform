PS C:\0-BlackBoxProject-0\OpenScroll\apps\server>  bunx prisma db pull --print
Loaded Prisma config from prisma.config.ts.

generator client {
  provider        = "prisma-client-js"
  output          = "../node_modules/.prisma/client"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
}

model Conversation {
  id                   String           @id @default(uuid())
  provider             String
  sourceUrl            String           @unique
  title                String
  model                String?
  createdAt            DateTime         @db.Timestamptz(6)
  updatedAt            DateTime         @db.Timestamptz(6)
  capturedAt           DateTime         @default(now()) @db.Timestamptz(6)
  messageCount         Int              @default(0)
  userMessageCount     Int              @default(0)
  aiMessageCount       Int              @default(0)
  totalWords           Int              @default(0)
  totalCharacters      Int              @default(0)
  totalTokens          Int?
  totalCodeBlocks      Int              @default(0)
  totalImages          Int              @default(0)
  totalTables          Int              @default(0)
  totalLatexBlocks     Int              @default(0)
  totalMermaidDiagrams Int              @default(0)
  totalToolCalls       Int              @default(0)
  metadata             Json             @default("{}")
  ownerId              Strin
