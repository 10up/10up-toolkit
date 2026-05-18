#!/usr/bin/env node
// Benchmark runner for 10up-toolkit baseline measurements.
//
// Usage:
//   node benchmarks/run.mjs                       # all targets, all scenarios
//   node benchmarks/run.mjs --target=10up-theme   # filter targets (CSV ok)
//   node benchmarks/run.mjs --scenario=cold-build # filter scenarios (CSV ok)
//   node benchmarks/run.mjs --dry-run             # print plan, don't execute
//
// Results land in benchmarks/results/<timestamp>-<sha>/ (gitignored).

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { performance } from 'node:perf_hooks';
import { execSync } from 'node:child_process';
import { targets as ALL_TARGETS } from './targets.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TOOLKIT_ROOT = resolve(HERE, '..');

// ─── Node version selection ──────────────────────────────────────────────────
// The toolkit's deps (copy-webpack-plugin, etc.) need Node 20+ for Array.toSorted.
// macOS default may be older — find the newest >= 20 in nvm and put it first
// on PATH for child processes. Children use `bash -c` (no profile) so this PATH
// wins over whatever the user's shell rc would set.

function pickModernNodeBin() {
	const current = parseInt(process.versions.node.split('.')[0], 10);
	if (current >= 20) return null; // already fine
	const nvmDir = join(homedir(), '.nvm/versions/node');
	if (!existsSync(nvmDir)) return null;
	const versions = readdirSync(nvmDir)
		.filter((v) => /^v\d+/.test(v))
		.map((v) => ({ raw: v, major: parseInt(v.slice(1).split('.')[0], 10) }))
		.filter((v) => v.major >= 20)
		.sort((a, b) => b.major - a.major);
	if (versions.length === 0) return null;
	return join(nvmDir, versions[0].raw, 'bin');
}

const MODERN_NODE_BIN = pickModernNodeBin();
// Vite+ installs to ~/.vite-plus/bin via the shell-rc that the install
// script writes. Bench children don't source rc files, so add it explicitly.
const VITE_PLUS_BIN = join(homedir(), '.vite-plus/bin');
const CHILD_PATH = [MODERN_NODE_BIN, VITE_PLUS_BIN, process.env.PATH]
	.filter(Boolean)
	.join(':');
const CHILD_ENV = { ...process.env, PATH: CHILD_PATH };

if (MODERN_NODE_BIN) {
	console.log(`Current Node ${process.versions.node} is <20; pinning children to ${MODERN_NODE_BIN}`);
}

// ─── CLI parsing ─────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const opts = {
	targets: null,
	scenarios: null,
	dryRun: false,
};
for (const arg of argv) {
	if (arg === '--dry-run') opts.dryRun = true;
	else if (arg.startsWith('--target=')) opts.targets = arg.slice(9).split(',');
	else if (arg.startsWith('--scenario=')) opts.scenarios = arg.slice(11).split(',');
	else if (arg === '--help' || arg === '-h') {
		console.log(
			[
				'Usage: node benchmarks/run.mjs [--target=a,b] [--scenario=c,d] [--dry-run]',
				'',
				`Targets:   ${ALL_TARGETS.map((t) => t.id).join(', ')}`,
				`Scenarios: ${[...new Set(ALL_TARGETS.flatMap((t) => t.scenarios.map((s) => s.id)))].join(', ')}`,
			].join('\n'),
		);
		process.exit(0);
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sh(cmd, { cwd }) {
	// Synchronous, captures combined output, used for setup/priming steps.
	return new Promise((res, rej) => {
		const p = spawn('bash', ['-c', cmd], {
			cwd,
			env: CHILD_ENV,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		let out = '';
		p.stdout.on('data', (d) => (out += d));
		p.stderr.on('data', (d) => (out += d));
		p.on('close', (code) =>
			code === 0
				? res(out)
				: rej(new Error(`setup failed (${code}): ${cmd}\n${out.slice(-2000)}`)),
		);
	});
}

function runTimed(cmd, cwd, { allowNonZeroExit = false } = {}) {
	return new Promise((res, rej) => {
		const start = performance.now();
		const p = spawn('bash', ['-c', cmd], {
			cwd,
			env: CHILD_ENV,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		// Drain streams without buffering; long builds produce a lot of output.
		p.stdout.on('data', () => {});
		p.stderr.on('data', () => {});
		p.on('close', (code) => {
			const elapsedMs = performance.now() - start;
			if (code !== 0 && !allowNonZeroExit) {
				return rej(new Error(`command failed (${code}): ${cmd}`));
			}
			res({ elapsedMs, exitCode: code });
		});
	});
}

function runUntilReady(cmd, cwd, readyPattern, timeoutMs = 5 * 60_000) {
	return new Promise((res, rej) => {
		const start = performance.now();
		// `detached: true` makes the child its own process group leader, so
		// process.kill(-pid, ...) reaches webpack/node descendants — not just bash.
		const p = spawn('bash', ['-c', cmd], {
			cwd,
			env: CHILD_ENV,
			stdio: ['ignore', 'pipe', 'pipe'],
			detached: true,
		});
		let buf = '';
		let settled = false;
		const killTree = (signal) => {
			try {
				process.kill(-p.pid, signal);
			} catch {}
		};
		const finish = (value, err) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			killTree('SIGTERM');
			setTimeout(() => killTree('SIGKILL'), 2000);
			if (err) rej(err);
			else res(value);
		};
		const check = (chunk) => {
			buf += chunk;
			// Bound memory: keep last 64KB.
			if (buf.length > 65_536) buf = buf.slice(-65_536);
			if (readyPattern.test(buf)) {
				finish({ elapsedMs: performance.now() - start, exitCode: null });
			}
		};
		p.stdout.on('data', (d) => check(d.toString()));
		p.stderr.on('data', (d) => check(d.toString()));
		p.on('close', (code) => {
			// Process closed before we saw the ready marker.
			if (!settled) finish(null, new Error(`dev process exited (${code}) before ready`));
		});
		const timer = setTimeout(() => {
			finish(null, new Error(`dev process timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});
}

function dirSizeBytes(absPath) {
	let total = 0;
	try {
		const stack = [absPath];
		while (stack.length) {
			const p = stack.pop();
			const s = statSync(p);
			if (s.isDirectory()) {
				for (const entry of readdirSync(p)) stack.push(join(p, entry));
			} else {
				total += s.size;
			}
		}
	} catch {
		return null;
	}
	return total;
}

function globDistSize(rootCwd, patterns) {
	// Tiny glob: supports a single * segment in the workspaces position.
	let total = 0;
	for (const pat of patterns) {
		// e.g. 'plugins/ignite-wp-*/dist' → split into ['plugins', 'ignite-wp-*', 'dist']
		const parts = pat.split('/');
		const starIdx = parts.findIndex((p) => p.includes('*'));
		if (starIdx === -1) {
			const s = dirSizeBytes(join(rootCwd, pat));
			if (s != null) total += s;
			continue;
		}
		const prefix = parts.slice(0, starIdx).join('/');
		const matcher = new RegExp(`^${parts[starIdx].replace(/\*/g, '.*')}$`);
		const suffix = parts.slice(starIdx + 1).join('/');
		let entries;
		try {
			entries = readdirSync(join(rootCwd, prefix));
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!matcher.test(entry)) continue;
			const full = join(rootCwd, prefix, entry, suffix);
			const s = dirSizeBytes(full);
			if (s != null) total += s;
		}
	}
	return total;
}

function stats(samples) {
	if (samples.length === 0) return null;
	const sorted = [...samples].sort((a, b) => a - b);
	const sum = sorted.reduce((a, b) => a + b, 0);
	const mid = Math.floor(sorted.length / 2);
	const median =
		sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
	return {
		runs: samples.length,
		min: sorted[0],
		max: sorted[sorted.length - 1],
		mean: sum / sorted.length,
		median,
	};
}

function fmtMs(ms) {
	if (ms == null) return '—';
	if (ms < 1000) return `${ms.toFixed(0)}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
	const m = Math.floor(ms / 60_000);
	const s = ((ms % 60_000) / 1000).toFixed(1);
	return `${m}m${s}s`;
}

function fmtBytes(b) {
	if (b == null) return '—';
	const units = ['B', 'KB', 'MB', 'GB'];
	let i = 0;
	let n = b;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${n.toFixed(n < 10 ? 2 : 1)}${units[i]}`;
}

// ─── Environment capture ─────────────────────────────────────────────────────

function captureEnv() {
	const get = (cmd, fallback = null) => {
		try {
			return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
		} catch {
			return fallback;
		}
	};
	return {
		date: new Date().toISOString(),
		node: process.version,
		npm: get('npm --version'),
		pnpm: get('pnpm --version'),
		os: `${process.platform} ${process.arch}`,
		osRelease: get('sw_vers -productVersion') || get('uname -r'),
		cpu: get(
			"sysctl -n machdep.cpu.brand_string 2>/dev/null || lscpu | grep 'Model name' | awk -F: '{print $2}'",
		),
		cores: get('sysctl -n hw.ncpu') || get('nproc'),
		mem: get("sysctl -n hw.memsize | awk '{printf \"%.0fGB\", $1/1073741824}'"),
		gitSha: get('git rev-parse --short HEAD', 'unknown'),
		gitBranch: get('git rev-parse --abbrev-ref HEAD', 'unknown'),
		gitDirty: get('git status --porcelain') ? 'dirty' : 'clean',
	};
}

function captureToolkitVersion(targetCwd) {
	try {
		const json = JSON.parse(
			execSync(`cd "${targetCwd}" && npm ls 10up-toolkit --depth=0 --json 2>/dev/null`).toString(),
		);
		const find = (deps) => {
			for (const [k, v] of Object.entries(deps || {})) {
				if (k === '10up-toolkit') return v.version;
				const nested = find(v.dependencies);
				if (nested) return nested;
			}
			return null;
		};
		return find(json.dependencies);
	} catch {
		return null;
	}
}

// ─── Plan + filter ───────────────────────────────────────────────────────────

const selected = ALL_TARGETS
	.filter((t) => !opts.targets || opts.targets.includes(t.id))
	.map((t) => ({
		...t,
		scenarios: t.scenarios.filter((s) => !opts.scenarios || opts.scenarios.includes(s.id)),
	}))
	.filter((t) => t.scenarios.length > 0);

if (selected.length === 0) {
	console.error('No targets matched the filter.');
	process.exit(1);
}

console.log('Plan:');
for (const t of selected) {
	console.log(`  ${t.id}`);
	for (const s of t.scenarios) {
		console.log(`    - ${s.id} (${s.kind}, ${s.runs}× ${s.command})`);
	}
}
if (opts.dryRun) {
	console.log('\nDry run — exiting.');
	process.exit(0);
}

// ─── Execute ─────────────────────────────────────────────────────────────────

const env = captureEnv();
const outDir = resolve(
	HERE,
	'results',
	`${env.date.replace(/[:.]/g, '-')}-${env.gitSha}`,
);
mkdirSync(outDir, { recursive: true });

const results = {
	env,
	targets: [],
};

for (const target of selected) {
	console.log(`\n━━━ ${target.id} — ${target.name}`);
	const toolkitVersion = captureToolkitVersion(target.cwd);
	const targetResult = {
		id: target.id,
		name: target.name,
		cwd: target.cwd,
		pm: target.pm,
		toolkitVersion,
		scenarios: [],
	};

	for (const scenario of target.scenarios) {
		console.log(`  ▶ ${scenario.id}`);
		const scenarioResult = {
			id: scenario.id,
			kind: scenario.kind,
			command: scenario.command,
			runsRequested: scenario.runs,
			samples: [],
			error: null,
		};

		try {
			// Priming step (e.g. populate cache before warm-build).
			if (scenario.priming) {
				console.log(`    priming: ${scenario.priming}`);
				await sh(scenario.priming, { cwd: target.cwd });
			}

			for (let i = 0; i < scenario.runs; i++) {
				// Per-run setup (e.g. rm -rf dist before each cold run).
				if (scenario.setup) {
					for (const cmd of scenario.setup) {
						await sh(cmd, { cwd: target.cwd });
					}
				}

				let sample;
				if (scenario.kind === 'timed') {
					sample = await runTimed(scenario.command, target.cwd, {
						allowNonZeroExit: scenario.allowNonZeroExit,
					});
				} else if (scenario.kind === 'dev-start') {
					sample = await runUntilReady(
						scenario.command,
						target.cwd,
						scenario.readyPattern,
					);
				} else {
					throw new Error(`unknown scenario kind: ${scenario.kind}`);
				}

				console.log(`    run ${i + 1}/${scenario.runs}: ${fmtMs(sample.elapsedMs)}`);
				scenarioResult.samples.push(sample.elapsedMs);
			}

			// Bundle size after the last run.
			if (scenario.distPath) {
				const bytes = dirSizeBytes(join(target.cwd, scenario.distPath));
				scenarioResult.distBytes = bytes;
				console.log(`    dist size: ${fmtBytes(bytes)}`);
			} else if (scenario.measureGlobDistSize) {
				const bytes = globDistSize(target.cwd, scenario.measureGlobDistSize);
				scenarioResult.distBytes = bytes;
				console.log(`    aggregate dist size: ${fmtBytes(bytes)}`);
			}

			scenarioResult.stats = stats(scenarioResult.samples);
		} catch (err) {
			console.log(`    ✗ ${err.message}`);
			scenarioResult.error = err.message;
		}

		targetResult.scenarios.push(scenarioResult);
		// Write after each scenario so a crash doesn't lose results.
		writeFileSync(join(outDir, 'raw.json'), JSON.stringify({ ...results, targets: [...results.targets, targetResult] }, null, 2));
	}

	results.targets.push(targetResult);
}

// ─── Report ──────────────────────────────────────────────────────────────────

writeFileSync(join(outDir, 'raw.json'), JSON.stringify(results, null, 2));

const lines = [];
lines.push('# Baseline benchmark report');
lines.push('');
lines.push(`**Date:** ${results.env.date}`);
lines.push(`**Git:** ${results.env.gitBranch} @ ${results.env.gitSha} (${results.env.gitDirty})`);
lines.push(
	`**Node:** ${results.env.node}  ·  **npm:** ${results.env.npm}  ·  **pnpm:** ${results.env.pnpm}`,
);
lines.push(`**Machine:** ${results.env.cpu} · ${results.env.cores} cores · ${results.env.mem} · ${results.env.os} ${results.env.osRelease}`);
lines.push('');

for (const t of results.targets) {
	lines.push(`## ${t.id} — ${t.name}`);
	lines.push('');
	lines.push(`Toolkit version: \`${t.toolkitVersion ?? 'unknown'}\` · CWD: \`${t.cwd}\``);
	lines.push('');
	lines.push('| Scenario | Runs | Median | Min | Max | Dist size |');
	lines.push('|---|---:|---:|---:|---:|---:|');
	for (const s of t.scenarios) {
		if (s.error) {
			lines.push(`| ${s.id} | — | error | | | | ${s.error} |`);
			continue;
		}
		const st = s.stats ?? {};
		lines.push(
			`| ${s.id} | ${st.runs ?? 0} | ${fmtMs(st.median)} | ${fmtMs(st.min)} | ${fmtMs(st.max)} | ${fmtBytes(s.distBytes)} |`,
		);
	}
	lines.push('');
}

writeFileSync(join(outDir, 'report.md'), lines.join('\n'));

console.log(`\n✓ Wrote ${join(outDir, 'raw.json')}`);
console.log(`✓ Wrote ${join(outDir, 'report.md')}`);
