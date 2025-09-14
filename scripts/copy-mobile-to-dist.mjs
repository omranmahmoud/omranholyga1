import fs from 'fs';
import path from 'path';

const root = process.cwd();
const desktopDist = path.join(root, 'dist');
const mobileDist = path.join(root, 'mobile', 'mobile-app', 'dist');
const target = path.join(desktopDist, 'm');

if (!fs.existsSync(desktopDist)) {
  console.error('[build:netlify] Desktop dist not found. Run vite build first.');
  process.exit(1);
}
if (!fs.existsSync(mobileDist)) {
  console.error('[build:netlify] Mobile dist not found. Run mobile export.');
  process.exit(1);
}
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

function copyDir(src, dest) {
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

copyDir(mobileDist, target);
console.log('[build:netlify] Copied mobile web build into dist/m');

// Lightweight .env loader (avoids adding dotenv dependency)
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return 0;
  let count = 0;
  try {
    const raw = fs.readFileSync(p, 'utf8');
    raw.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      // Remove surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) { // don't override existing
        process.env[key] = val;
        count++;
      }
    });
  } catch (e) {
    console.warn('[build:netlify] Failed parsing env file', p, e.message);
  }
  return count;
}

// Load .env then .env.production so production overrides apply
const loadedDev = loadEnvFile(path.join(root, '.env'));
const loadedProd = loadEnvFile(path.join(root, '.env.production'));
if (loadedDev || loadedProd) {
  console.log(`[build:netlify] Loaded env vars (.env: ${loadedDev}, .env.production: ${loadedProd})`);
}

// Inject API base (Netlify env or fallback). Provide NX/Netlify env variable names.
const apiBase = process.env.VITE_API_BASE || process.env.API_BASE || process.env.EXPO_PUBLIC_API_URL || '';
if (apiBase) {
  const indexFile = path.join(target, 'index.html');
  if (fs.existsSync(indexFile)) {
    let html = fs.readFileSync(indexFile, 'utf8');
    const injectTag = `<script>window.__API_BASE__ = ${JSON.stringify(apiBase)};</script>`;
    if (!html.includes('window.__API_BASE__')) {
      if (/<head>/i.test(html)) {
        html = html.replace(/<head>/i, '<head>\n' + injectTag);
      } else {
        html = injectTag + '\n' + html;
      }
      fs.writeFileSync(indexFile, html, 'utf8');
      console.log('[build:netlify] Injected API base into /m/index.html ->', apiBase);
    } else {
      console.log('[build:netlify] API base already present in /m/index.html');
    }
  } else {
    console.warn('[build:netlify] Could not find /m/index.html to inject API base');
  }
} else {
  console.log('[build:netlify] No API base env (VITE_API_BASE/API_BASE/EXPO_PUBLIC_API_URL) provided; skipping injection');
}
