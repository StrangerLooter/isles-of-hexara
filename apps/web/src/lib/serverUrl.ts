/**
 * Resolves the authoritative game server URL for Socket.IO and REST API calls.
 * Priority order:
 *  1. Runtime window override (for testing/debugging)
 *  2. GAME_SERVER_URL env var (set on Vercel without VITE_ prefix — works via envPrefix config)
 *  3. VITE_GAME_SERVER_URL (standard Vite env var)
 *  4. NEXT_PUBLIC_GAME_SERVER_URL (for Next.js compat)
 *  5. Fallback to localhost for local development
 */
export function getServerUrl(): string {
  if (typeof window !== 'undefined' && (window as any).__GAME_SERVER_URL__) {
    return (window as any).__GAME_SERVER_URL__;
  }
  const env = (import.meta as any).env ?? {};
  let url =
    env.GAME_SERVER_URL ||
    env.VITE_GAME_SERVER_URL ||
    env.NEXT_PUBLIC_GAME_SERVER_URL;

  // Auto-correct stale or misspelled Render service name to the live backend
  if (url && typeof url === 'string' && url.includes('isles-of-hexara-server.onrender.com')) {
    url = url.replace('isles-of-hexara-server.onrender.com', 'isles-of-hexara.onrender.com');
  }

  if (url && typeof url === 'string' && url.trim().length > 0) {
    return url.trim();
  }

  // In production browser environments (Vercel, custom domain), default to live Render backend
  if (
    typeof window !== 'undefined' &&
    window.location &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return 'https://isles-of-hexara.onrender.com';
  }

  return 'http://localhost:3001';
}

/** Singleton resolved URL — computed once at module load */
export const SERVER_URL = getServerUrl();
export const API_BASE = SERVER_URL;
