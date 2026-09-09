import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const folder = await mkdtemp(path.join(tmpdir(), 'enterpriseiq-test-'));
const base = 'http://127.0.0.1:3197';
let child;
async function start() {
  child = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    env: { ...process.env, PORT: '3197', DATA_FILE: path.join(folder, 'db.json'), JWT_SECRET: 'integration-test-secret', NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  child.stderr.on('data', d => process.stderr.write(d));
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('Server exited');
    try { if ((await fetch(base + '/api/health')).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Server did not become ready');
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const done = new Promise(resolve => child.once('exit', resolve));
  child.kill(); await done;
}
async function request(url, token, body, method) {
  return fetch(base + '/api' + url, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}
try {
  await start();
  assert.equal((await request('/auth/login', null, { email: 'admin@enterpriseiq.com' })).status, 400);
  const login = await request('/auth/login', null, { email: 'employee@enterpriseiq.com', password: 'employee123' });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  assert.equal((await request('/users', token)).status, 403);
  assert.equal((await request('/documents/doc-fin-procurement/summary', token, {})).status, 403);
  assert.equal((await request('/chat/compare', token, { docId1: 'doc-hr-leave', docId2: 'doc-fin-procurement' })).status, 403);
  assert.equal((await request('/bookmarks/doc-hr-leave', token, { saved: true }, 'PUT')).status, 200);
  assert.equal((await request('/auth/profile', token, { name: 'Updated Employee', preferences: { citations: false, suggestions: true } }, 'PUT')).status, 200);
  assert.equal((await request('/auth/register', null, { name: 'Test User', email: 'test@example.com', password: 'testing123', departmentId: 'dep-hr' })).status, 200);
  assert.equal((await request('/auth/password', token, { currentPassword: 'employee123', newPassword: 'updated-password' }, 'PUT')).status, 200);
  await stop(); await start();
  assert.equal((await (await request('/bookmarks', token)).json())[0].id, 'doc-hr-leave');
  assert.equal((await (await request('/auth/me', token)).json()).name, 'Updated Employee');
  assert.equal((await request('/auth/login', null, { email: 'employee@enterpriseiq.com', password: 'updated-password' })).status, 200);
  assert.equal((await request('/unknown', token)).status, 404);
  const html = await (await fetch(base)).text();
  const asset = html.match(/src="([^"]+\.js)"/)[1];
  assert.match((await fetch(base + asset)).headers.get('content-type'), /javascript/);
  console.log('PASS: authentication, permissions, registration, bookmarks, profile, password, restart persistence, API errors, production assets');
} finally {
  await stop();
  const resolved = path.resolve(folder);
  assert.ok(resolved.startsWith(path.resolve(tmpdir()) + path.sep) && path.basename(resolved).startsWith('enterpriseiq-test-'));
  await rm(resolved, { recursive: true, force: true });
}
