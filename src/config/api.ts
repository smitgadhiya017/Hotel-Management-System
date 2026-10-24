/**
 * Base API URL for backend communication.
 * When deployed on Vercel with a separate backend on Render,
 * set VITE_API_URL in Vercel to your Render backend URL (e.g. https://hotel-management-system.onrender.com).
 * In local development or same-host deployment, it defaults to empty string (relative /api paths).
 */
export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_URL as string | undefined) || ''
).replace(/\/$/, '');
