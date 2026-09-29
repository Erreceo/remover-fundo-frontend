const path = require('path');
const fs = require('fs');

/**
 * Load environment variables from root or local .env file if available
 */
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
              const key = trimmed.slice(0, idx).trim();
              const value = trimmed.slice(idx + 1).trim();
              if (process.env[key] === undefined && value !== '') {
                process.env[key] = value.replace(/^['"](.*)['"]$/, '$1');
              }
            }
          }
        });
        break;
      } catch (err) {
        console.warn(`Could not read .env file at ${envPath}:`, err.message);
      }
    }
  }
}

loadEnv();

const backendHost = process.env.BACKEND_HOST || '127.0.0.1';
const backendPort = process.env.BACKEND_PORT || '8000';
const resolvedHost = backendHost === '0.0.0.0' ? '127.0.0.1' : backendHost;
const target = process.env.BACKEND_URL || `http://${resolvedHost}:${backendPort}`;

module.exports = {
  "/api": {
    "target": target,
    "secure": false,
    "changeOrigin": true
  }
};
