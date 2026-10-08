import { WorkerEnv, ExecutionContext } from './types/worker';
import { handleApiRequest } from './server/apiHandler';

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 1. Handle API requests through Cloudflare D1
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx);
    }

    // 2. Serve built React SPA static assets through Cloudflare Assets binding
    if (env.ASSETS) {
      try {
        const response = await env.ASSETS.fetch(request);
        if (response.status === 404 && !url.pathname.includes('.')) {
          // SPA fallback: return index.html for client-side routing
          const indexUrl = new URL('/', request.url);
          return env.ASSETS.fetch(new Request(indexUrl.toString(), request));
        }
        return response;
      } catch (err) {
        console.error('Assets fetch failed:', err);
      }
    }

    return new Response('B. B. Bale & Co. Chambers — Application running. Asset handler loading.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
