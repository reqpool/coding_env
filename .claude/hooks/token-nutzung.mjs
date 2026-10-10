#!/usr/bin/env node
// Books the Claude Code token usage of the current session into the repository that is
// about to receive a commit. Registered as a PreToolUse hook on Bash in .claude/settings.json.
//
// How it works:
//   - Runs only when the Bash command contains "git commit"; otherwise exits immediately.
//   - Reads the session transcript (and subagent transcripts) and sums the usage of every
//     API response not yet booked. What has been booked is remembered per session in
//     ~/.claude/token-nutzung/<session>.json, so tokens are counted exactly once, even
//     when one session works on several repositories: each commit takes the tokens spent
//     since the previous one.
//   - Adds them to .claude/token-nutzung/<date>-<session>.json in the target repository and
//     stages that file, so it lands in the very same commit.
//
// The hook may be registered twice (in the repository and in the organisation's managed settings,
// which also reach multi-repository cloud sessions). The tool_use_id of the commit is remembered,
// so the second call for the same commit books nothing.
//
// Only repositories that carry this script take part. app-template books its own effort as
// well; app-anlegen.yml removes that folder from every repository created from the template. The hook never blocks a commit:
// every error is swallowed and the exit code is always 0.
// Format and evaluation: reqpool/azure-foundation, docs/Token-Nutzung.md.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FIELDS = ['eingabe', 'cache_schreiben', 'cache_lesen', 'ausgabe'];
const HOOK = path.join('.claude', 'hooks', 'token-nutzung.mjs');
const TARGET_DIR = path.join('.claude', 'token-nutzung');
const FORMAT = 1;

export function isCommit(command) {
  return /\bgit\b(?:\s+-[Cc]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+commit\b/.test(command || '');
}

function unquote(s) {
  return s.replace(/^(['"])(.*)\1$/, '$2');
}

// Directory the commit runs in: "git -C <dir> commit", else the last "cd <dir>" before it,
// else the working directory of the hook.
export function commitDir(command, cwd) {
  const commitAt = command.search(/\bgit\b[^;&|]*\bcommit\b/);
  const segment = commitAt >= 0 ? command.slice(commitAt) : command;
  const dashC = segment.match(/^git\s+-C\s+("[^"]+"|'[^']+'|\S+)/);
  if (dashC) return path.resolve(cwd, unquote(dashC[1]));
  const before = commitAt >= 0 ? command.slice(0, commitAt) : '';
  let dir = cwd;
  for (const m of before.matchAll(/(?:^|[;&|(]\s*)cd\s+("[^"]+"|'[^']+'|[^\s;&|)]+)/g)) {
    dir = path.resolve(dir, unquote(m[1]).replace(/^~(?=\/|$)/, os.homedir()));
  }
  return dir;
}

function usageOf(u) {
  return {
    eingabe: u.input_tokens || 0,
    cache_schreiben: u.cache_creation_input_tokens || 0,
    cache_lesen: u.cache_read_input_tokens || 0,
    ausgabe: u.output_tokens || 0,
  };
}

function transcripts(transcriptPath, sessionId) {
  const files = [transcriptPath];
  const sub = path.join(path.dirname(transcriptPath), sessionId);
  const walk = (dir) => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.jsonl')) files.push(p);
    }
  };
  walk(sub);
  return files;
}

// Latest usage per API response. A response is written as several lines (one per content
// block) that repeat the usage; the last line carries the final numbers.
export function readUsage(files) {
  const responses = new Map();
  for (const file of files) {
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      if (!line.includes('"usage"')) continue;
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      const msg = entry.message;
      if (entry.type !== 'assistant' || !msg?.usage) continue;
      const model = msg.model || 'unbekannt';
      if (model === '<synthetic>') continue;
      const id = msg.id || entry.requestId || entry.uuid;
      responses.set(id, { model, zeit: entry.timestamp, ...usageOf(msg.usage) });
    }
  }
  return responses;
}

// Difference between what the transcript shows now and what was booked before.
export function delta(responses, booked) {
  const perModel = {};
  let first = null;
  let last = null;
  for (const [id, r] of responses) {
    const before = booked[id] || [0, 0, 0, 0];
    const now = FIELDS.map((f) => r[f]);
    const diff = now.map((v, i) => Math.max(0, v - before[i]));
    if (diff.every((v) => v === 0) && booked[id]) continue;
    const m = (perModel[r.model] ||= { anfragen: 0, eingabe: 0, cache_schreiben: 0, cache_lesen: 0, ausgabe: 0 });
    if (!booked[id]) m.anfragen += 1;
    FIELDS.forEach((f, i) => { m[f] += diff[i]; });
    booked[id] = now;
    if (r.zeit && (!first || r.zeit < first)) first = r.zeit;
    if (r.zeit && (!last || r.zeit > last)) last = r.zeit;
  }
  return { perModel, first, last };
}

export function addTo(record, d, sessionId, now) {
  const r = record || { format: FORMAT, sitzung: sessionId, von: null, bis: null, commits: 0, modelle: {}, summe: {} };
  for (const [model, v] of Object.entries(d.perModel)) {
    const m = (r.modelle[model] ||= { anfragen: 0, eingabe: 0, cache_schreiben: 0, cache_lesen: 0, ausgabe: 0 });
    for (const k of Object.keys(m)) m[k] += v[k];
  }
  const sum = { anfragen: 0, eingabe: 0, cache_schreiben: 0, cache_lesen: 0, ausgabe: 0 };
  for (const m of Object.values(r.modelle)) for (const k of Object.keys(sum)) sum[k] += m[k];
  sum.gesamt = sum.eingabe + sum.cache_schreiben + sum.cache_lesen + sum.ausgabe;
  r.summe = sum;
  if (d.first && (!r.von || d.first < r.von)) r.von = d.first;
  r.bis = d.last && (!r.bis || d.last > r.bis) ? d.last : (r.bis || now);
  r.commits += 1;
  return r;
}

function withLock(lockFile, fn) {
  for (let i = 0; i < 50; i++) {
    try {
      const fd = fs.openSync(lockFile, 'wx');
      try { return fn(); } finally { fs.closeSync(fd); fs.rmSync(lockFile, { force: true }); }
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - fs.statSync(lockFile).mtimeMs > 30000) fs.rmSync(lockFile, { force: true }); } catch { /* gone */ }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
    }
  }
  return undefined;
}

export function book({ sessionId, transcriptPath, command, cwd, stateDir, toolUseId, now = new Date().toISOString() }) {
  if (!isCommit(command) || !sessionId || !transcriptPath) return null;
  const dir = commitDir(command, cwd);
  let root;
  try {
    root = execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
  if (!fs.existsSync(path.join(root, HOOK))) return null;

  fs.mkdirSync(stateDir, { recursive: true });
  const stateFile = path.join(stateDir, `${sessionId}.json`);
  return withLock(`${stateFile}.lock`, () => {
    let state = { gebucht: {} };
    try { state = JSON.parse(fs.readFileSync(stateFile, 'utf8')); } catch { /* first booking */ }
    if (toolUseId && state.letzter === toolUseId) return null;
    if (toolUseId) state.letzter = toolUseId;
    const d = delta(readUsage(transcripts(transcriptPath, sessionId)), state.gebucht);

    const targetDir = path.join(root, TARGET_DIR);
    let existing;
    try { existing = fs.readdirSync(targetDir).find((f) => f.endsWith(`-${sessionId}.json`)); } catch { /* no folder yet */ }
    // Nothing new and no file for this session yet: leave the repository untouched.
    if (!existing && Object.keys(d.perModel).length === 0) {
      fs.writeFileSync(stateFile, JSON.stringify(state));
      return null;
    }
    fs.mkdirSync(targetDir, { recursive: true });
    const name = existing || `${(d.first || now).slice(0, 10)}-${sessionId}.json`;
    const target = path.join(targetDir, name);
    let record = null;
    try { record = JSON.parse(fs.readFileSync(target, 'utf8')); } catch { /* new file */ }
    record = addTo(record, d, sessionId, now);

    fs.writeFileSync(target, JSON.stringify(record, null, 2) + '\n');
    fs.writeFileSync(stateFile, JSON.stringify(state));
    execFileSync('git', ['-C', root, 'add', '--', path.join(TARGET_DIR, name)], { stdio: 'ignore' });
    return { target, record };
  });
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const hook = JSON.parse(input || '{}');
  book({
    sessionId: hook.session_id,
    transcriptPath: hook.transcript_path,
    command: hook.tool_input?.command || '',
    cwd: hook.cwd || process.cwd(),
    toolUseId: hook.tool_use_id,
    stateDir: process.env.TOKEN_NUTZUNG_STATUS || path.join(os.homedir(), '.claude', 'token-nutzung'),
  });
}

if (process.argv[1]?.endsWith("token-nutzung.mjs")) {
  main().catch(() => {}).finally(() => process.exit(0));
}
