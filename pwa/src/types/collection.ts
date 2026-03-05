/**
 * Collection type definition for local Dexie storage.
 * We'll persist collections in the vivim-db's syncQueue or
 * a dedicated 'collections' IDB store in a future DB migration.
 * For now we use localStorage-backed Zustand as a stepping stone.
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string; // hex
  conversationIds: string[];
  createdAt: string;
  updatedAt: string;
}
