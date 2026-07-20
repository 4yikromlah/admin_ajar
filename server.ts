import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const CONFIG_FILE = path.join(__dirname, 'spreadsheet_config.json');

app.use(express.json());

// Load saved spreadsheet URL on startup
let spreadsheetUrl = '';
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    spreadsheetUrl = parsed.url || '';
    console.log('[Server] Loaded saved spreadsheet URL:', spreadsheetUrl);
  }
} catch (e) {
  console.error('[Server] Failed to read CONFIG_FILE:', e);
}

// ----------------------------------------------------------------------------
// API ROUTES (Must be defined BEFORE Vite middleware)
// ----------------------------------------------------------------------------
app.get('/api/superadmin-url', (req, res) => {
  res.json({ url: spreadsheetUrl });
});

app.post('/api/superadmin-url', (req, res) => {
  const { url } = req.body;
  if (typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL parameter' });
  }
  spreadsheetUrl = url.trim();
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ url: spreadsheetUrl }), 'utf-8');
    console.log('[Server] Saved new spreadsheet URL:', spreadsheetUrl);
    res.json({ status: 'success', url: spreadsheetUrl });
  } catch (e) {
    console.error('[Server] Failed to write CONFIG_FILE:', e);
    res.status(500).json({ error: 'Failed to write config' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ----------------------------------------------------------------------------
// VITE DEV SERVER MIDDLEWARE / PRODUCTION STATIC ROUTING
// ----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Server] Starting in DEVELOPMENT mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Starting in PRODUCTION mode...');
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer();
