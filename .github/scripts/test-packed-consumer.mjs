import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = process.cwd();
const temporaryDirectory = mkdtempSync(join(tmpdir(), '10up-toolkit-consumer-'));
const packageDirectory = join(temporaryDirectory, 'packages');
const consumerDirectory = join(temporaryDirectory, 'consumer');
const fixtureDirectory = resolve(root, '.github/fixtures/consumer');
const workspaces = [
	'packages/babel-preset-default',
	'packages/eslint-config',
	'packages/stylelint-config',
	'packages/toolkit',
];

const run = (command, args, options = {}) =>
	execFileSync(command, args, {
		cwd: root,
		stdio: 'inherit',
		...options,
	});

try {
	mkdirSync(packageDirectory, { recursive: true });
	cpSync(fixtureDirectory, consumerDirectory, { recursive: true });

	for (const workspace of workspaces) {
		run('npm', ['pack', '--workspace', workspace, '--pack-destination', packageDirectory]);
	}

	const packages = readdirSync(packageDirectory).map((file) => join(packageDirectory, file));

	run('npm', ['install', '--strict-peer-deps', '--ignore-scripts', '--save-dev', ...packages], {
		cwd: consumerDirectory,
	});

	for (const script of ['build', 'lint:js', 'lint:style']) {
		run('npm', ['run', script], { cwd: consumerDirectory });
	}
} finally {
	rmSync(temporaryDirectory, { recursive: true, force: true });
}
