import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { handleApiRequest } from './src/server/apiHandler';
import { createDevD1Database } from './src/server/devD1Adapter';

function devApiMiddlewarePlugin(): Plugin {
  const devDb = createDevD1Database();

  return {
    name: 'dev-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        let bodyBuffer = Buffer.alloc(0);
        req.on('data', chunk => {
          bodyBuffer = Buffer.concat([bodyBuffer, chunk]);
        });

        req.on('end', async () => {
          try {
            const host = req.headers.host || 'localhost:3000';
            const fullUrl = `http://${host}${req.url}`;
            const isBodyMethod = req.method !== 'GET' && req.method !== 'HEAD';
            const webRequest = new Request(fullUrl, {
              method: req.method,
              headers: req.headers as any,
              body: isBodyMethod && bodyBuffer.length > 0 ? bodyBuffer : undefined
            });

            const webResponse = await handleApiRequest(webRequest, { DB: devDb as any });

            res.statusCode = webResponse.status;
            webResponse.headers.forEach((value, key) => {
              res.setHeader(key, value);
            });

            const responseBuffer = Buffer.from(await webResponse.arrayBuffer());
            res.end(responseBuffer);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Internal Dev Server Error' }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devApiMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
