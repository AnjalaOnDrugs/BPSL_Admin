import { ConvexReactClient } from 'convex/react';

// Shared Convex deployment with the blackpinksrilanka.org website.
// URL comes from .env (VITE_CONVEX_URL).
export const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
