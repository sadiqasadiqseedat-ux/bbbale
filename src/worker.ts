/**
 * Cloudflare Worker Entry Point
 * Used when deploying directly via `wrangler deploy` with Cloudflare D1 binding "env.DB"
 */

import { handleApiRequest, Env } from './server/apiHandler';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    // Return 404 for non-API routes when used as API worker
    return new Response('B. B. Bale & Co. Chambers API Gateway', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
