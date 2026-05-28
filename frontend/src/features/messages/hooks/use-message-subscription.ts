/**
 * useMessageSubscription
 *
 * Previously drove mock auto-replies in the seed data path.
 * Matrix real-time updates are handled directly by matrix-store.ts via
 * the RoomEvent.Timeline listener — no subscription hook is needed here.
 *
 * Hook is kept as a no-op so call sites in messages-page.tsx don't need
 * to be changed.
 */
export function useMessageSubscription() {
  // no-op: Matrix timeline events are handled in matrix-store initClient
}
