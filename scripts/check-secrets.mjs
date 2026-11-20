#!/usr/bin/env node
// Refuses a build that contains anything shaped like a secret: run on dist/ by CI and by scripts/deploy-web.sh
// before publishing. The app ships no keys of its own (each person's AI key stays on their phone), so any match
// means something leaked into the bundle, e.g. a VITE_ variable or a pasted key.
// Usage: node scripts/check-secrets.mjs <dir>   (exits 1 and lists what it found, values cut short)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const PATTERNS = {
  "Anthropic key": /sk-ant-[A-Za-z0-9_-]{20,}/g,
  "OpenAI key": /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{32,}/g,
  "Google API key": /AIza[0-9A-Za-z_-]{35}/g,
  "GitHub token": /\bgh[pousr]_[A-Za-z0-9]{36,}/g,
  "Supabase key": /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]{10,}/g,
  "JWT": /eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
  "Stripe key": /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}/g,
  "AWS key": /\bAKIA[0-9A-Z]{16}\b/g,
  "Private key": /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  "publik key or token": /\b(?:pk|pat)_[A-Za-z0-9]{16,}/g,
  "Database URL with password": /postgres(?:ql)?:\/\/[^\s:'"]+:[^\s@'"]{4,}@/g,
  "Slack token": /\bxox[abpors]-[A-Za-z0-9-]{10,}/g,
  "Development-only key route": /__dev\/ai-key|OQ_DEV_/g,
};

/** Every match in every file under dir, as { file, kind, preview }. */
export function scan(dir) {
  const found = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const path = join(d, name);
      if (statSync(path).isDirectory()) walk(path);
      else {
        const text = readFileSync(path, "latin1");
        for (const [kind, re] of Object.entries(PATTERNS)) {
          for (const m of text.matchAll(re)) found.push({ file: relative(dir, path), kind, preview: `${m[0].slice(0, 10)}…` });
        }
      }
    }
  };
  walk(dir);
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir) {
    console.error("usage: node scripts/check-secrets.mjs <dir>");
    process.exit(2);
  }
  const found = scan(dir);
  for (const f of found) console.error(`${f.kind} in ${f.file}: ${f.preview}`);
  if (found.length) {
    console.error(`check-secrets: ${found.length} possible secret(s) in ${dir}. Not publishing.`);
    process.exit(1);
  }
  console.log(`check-secrets: nothing secret-shaped in ${dir}.`);
}
