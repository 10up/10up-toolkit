const { execFileSync } = require('node:child_process');
const { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');

const repositoryRoot = resolve(__dirname, '../../../..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), '10up-toolkit-consumer-'));
const packageDirectory = join(temporaryDirectory, 'packages');
const consumerDirectory = join(temporaryDirectory, 'consumer');
const fixtureDirectory = join(__dirname, 'fixture');
const workspaces = [
	'packages/babel-preset-default',
	'packages/eslint-config',
	'packages/stylelint-config',
	'packages/toolkit',
];

const run = (command, args, options = {}) =>
	execFileSync(command, args, {
		cwd: repositoryRoot,
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
