import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only shared store: keeps the live auction state in a file so every
// device on the network (admin, team logins) sees the same data.
function auctionStatePlugin(): Plugin {
  const stateFile = fileURLToPath(new URL('./auction-state.json', import.meta.url));

  return {
    name: 'auction-state',
    configureServer(server) {
      server.middlewares.use('/api/state', (req, res) => {
        res.setHeader('Cache-Control', 'no-store');

        if (req.method === 'GET') {
          if (!fs.existsSync(stateFile)) {
            res.statusCode = 404;
            res.end();
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(stateFile, 'utf8'));
          return;
        }

        if (req.method === 'PUT') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              JSON.parse(body);
              fs.writeFileSync(stateFile, body);
              res.end('ok');
            } catch {
              res.statusCode = 400;
              res.end('invalid json');
            }
          });
          return;
        }

        res.statusCode = 405;
        res.end();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), auctionStatePlugin()],
});
