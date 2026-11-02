// Minimal ElevenLabs client. The key comes from ELEVENLABS_API_KEY, or from a .env file in the
// project folder (VIDEO_PROJECT) or any folder above it: "ELEVENLABS_API_KEY=sk_..." or a bare key line.
// Never print the key.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

function loadKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY.trim();
  for (let d = path.resolve(process.env.VIDEO_PROJECT ?? process.cwd()); ; d = path.dirname(d)) {
    const f = path.join(d, '.env');
    if (existsSync(f)) {
      const lines = readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      const named = lines.find((l) => l.startsWith('ELEVENLABS_API_KEY='));
      const key = named ? named.split('=').slice(1).join('=') : lines.find((l) => /^sk_\w+$/.test(l));
      if (key) return key.replace(/^["']|["']$/g, '');
    }
    if (path.dirname(d) === d) break;
  }
  throw new Error('No ElevenLabs key: set ELEVENLABS_API_KEY or put it in a .env next to (or above) the project');
}

const BASE = 'https://api.elevenlabs.io';
let KEY;
const key = () => (KEY ??= loadKey());

async function send(url, init) {
  const res = await fetch(url, { ...init, headers: { 'xi-api-key': key(), ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) {
    const hint = res.status === 402 ? ' (free plans cannot use Voice Library voices through the API: record on the web and use provider "file")'
      : res.status === 401 ? ' (the key is missing a permission: enable it on the API Keys page)' : '';
    throw new Error(`ElevenLabs ${init.method ?? 'GET'} ${new URL(url).pathname} → ${res.status}${hint}: ${text.slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : null;
}

export function api(pathname, { method = 'GET', query, body } = {}) {
  const url = new URL(pathname, BASE);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, v);
  return send(url, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
}

export function apiForm(pathname, form) {
  return send(new URL(pathname, BASE), { method: 'POST', body: form });
}
