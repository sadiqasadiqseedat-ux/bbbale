import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function cloudflareD1ProxyPlugin(): Plugin {
  return {
    name: 'cloudflare-d1-proxy',
    configureServer(server) {
      server.middlewares.use('/api/d1/query', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const accountId = data.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
            const databaseId = data.databaseId || process.env.CLOUDFLARE_D1_DATABASE_ID;
            const apiToken = data.apiToken || process.env.CLOUDFLARE_API_TOKEN;

            if (!accountId || !databaseId || !apiToken) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: 'Cloudflare D1 credentials missing. Please configure Account ID, Database ID, and API Token in Administration or .env.'
              }));
              return;
            }

            const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
            const cfRes = await fetch(cfUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
              },
              body: JSON.stringify({
                sql: data.sql,
                params: data.params || []
              })
            });

            const cfText = await cfRes.text();
            res.statusCode = cfRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(cfText);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message || 'Internal proxy error querying Cloudflare D1' }));
          }
        });
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), cloudflareD1ProxyPlugin()],
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
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
