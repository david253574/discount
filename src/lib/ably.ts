/**
 * Server-side Ably REST client.
 *
 * Used ONLY in server-side code (API routes, Server Components).
 * The ABLY_API_KEY (root key) is NEVER sent to the browser or Android.
 * Clients receive short-lived scoped tokens from /api/ably/auth instead.
 */
import Ably from 'ably';

let _rest: Ably.Rest | null = null;

function getAblyRest(): Ably.Rest | null {
  if (!process.env.ABLY_API_KEY) {
    console.warn('[Ably] ABLY_API_KEY is not set — realtime events will be skipped.');
    return null;
  }
  if (!_rest) {
    _rest = new Ably.Rest({ key: process.env.ABLY_API_KEY });
  }
  return _rest;
}

/**
 * Channel naming convention:
 *   private:customer-care:order:<orderId>
 *
 * - `private:` prefix enforces Ably token auth (unauthenticated clients
 *   cannot subscribe without a scoped token from /api/ably/auth).
 * - `customer-care:order:` namespaces events away from any other Ably apps.
 * - `<orderId>` is the canonical Order.id — the only client-facing routing key.
 */
export function orderChannel(orderId: string): string {
  return `private:customer-care:order:${orderId}`;
}

/**
 * Publish a minimal routing-hint event after a message has been
 * successfully committed to Turso via Prisma.
 *
 * The payload intentionally contains ONLY navigation identifiers.
 * It does NOT contain: message body, attachment URLs, Blob tokens,
 * session tokens, financial data, or any authorization data.
 *
 * Receiving clients MUST call GET /api/payment/[orderId] to get
 * the authoritative message data through the existing auth layer.
 *
 * Failure here is non-fatal: the DB write already succeeded.
 */
export async function publishMessageCreated(
  orderId: string,
  messageId: string,
): Promise<void> {
  const rest = getAblyRest();
  if (!rest) return; // gracefully skip if not configured

  try {
    await rest.channels.get(orderChannel(orderId)).publish('message.created', {
      type: 'message.created',
      orderId,
      messageId,
    });
  } catch (err) {
    // Log but do NOT throw — the caller's DB transaction already succeeded.
    console.error('[Ably] Failed to publish message.created event:', err);
  }
}

/**
 * Issue a short-lived capability-scoped Ably TokenRequest.
 * Called by /api/ably/auth after the server has verified session + ownership.
 *
 * The token is scoped to subscribe-only on the specific channel.
 * It does NOT grant publish or presence capabilities to the client.
 */
export async function createTokenRequest(
  channel: string,
  clientId: string,
): Promise<Ably.TokenRequest> {
  const rest = getAblyRest();
  if (!rest) throw new Error('Ably is not configured');

  return rest.auth.createTokenRequest({
    clientId,
    capability: {
      [channel]: ['subscribe'],
    },
    ttl: 3600 * 1000, // 1 hour in milliseconds
  });
}
