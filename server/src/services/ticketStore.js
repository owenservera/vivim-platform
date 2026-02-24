/**
 * Ticket Store for Secure SSE Handshakes
 *
 * Provides a short-lived, in-memory storage for one-time-use tickets.
 * Used to exchange complex auth/crypto payloads (POST) for a simple ticket (GET)
 * to secure EventSource connections.
 */
import { randomUUID } from 'crypto';

class TicketStore {
  constructor(ttlMs = 30000) {
    this.tickets = new Map();
    this.ttlMs = ttlMs;

    // Cleanup interval (run every minute)
    setInterval(() => this.cleanup(), 60000).unref();
  }

  /**
   * Create a new ticket for a payload
   * @param {Object} payload - The data to store (e.g., keys, url)
   * @returns {string} The ticket ID
   */
  create(payload) {
    const ticketId = randomUUID();
    const expiresAt = Date.now() + this.ttlMs;

    this.tickets.set(ticketId, {
      payload,
      expiresAt,
    });

    return ticketId;
  }

  /**
   * Consume a ticket and retrieve its payload
   * Tickets are one-time use only.
   * @param {string} ticketId
   * @returns {Object|null} The payload or null if invalid/expired
   */
  consume(ticketId) {
    const ticket = this.tickets.get(ticketId);

    if (!ticket) {
      return null;
    }

    // Check expiration
    if (Date.now() > ticket.expiresAt) {
      this.tickets.delete(ticketId);
      return null;
    }

    // One-time use: remove immediately
    this.tickets.delete(ticketId);
    return ticket.payload;
  }

  /**
   * Remove expired tickets
   */
  cleanup() {
    const now = Date.now();
    for (const [id, ticket] of this.tickets.entries()) {
      if (now > ticket.expiresAt) {
        this.tickets.delete(id);
      }
    }
  }
}

// Singleton instance
export const ticketStore = new TicketStore();
