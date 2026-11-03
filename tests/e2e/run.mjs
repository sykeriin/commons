// Starts the dev server, runs every browser test against it, then stops the server.
// Needs Chromium: `npx playwright install chromium` (already present in the Claude Code cloud image).
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = process.env.E2E_PORT ?? '3111';
const BASE = process.env.E2E_URL ?? `http://localhost:${PORT}`;
let server;
if (!process.env.E2E_URL) {
  server = spawn('npx', ['vite', `--port=${PORT}`, '--host=127.0.0.1', '--strictPort'], { stdio: 'ignore', detached: false });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break; } catch { /* not up yet */ } await sleep(500); }
}
let failed = 0;
for (const t of ['smoke', 'flows', 'overflow', 'contrast']) {
  console.log(`\n== ${t}`);
  const code = await new Promise(res => spawn('node', [`tests/e2e/${t}.mjs`], { stdio: 'inherit', env: { ...process.env, E2E_URL: BASE } }).on('exit', res));
  if (code) failed++;
}
server?.kill();
console.log(failed ? `\n${failed} e2e suite(s) failed` : '\nall e2e suites passed');
process.exit(failed ? 1 : 0);
