#!/usr/bin/env node

/**
 * 10up-build CLI
 *
 * esbuild-powered WordPress build tool
 */

import('../dist/cli.js').then(({ cli }) => {
	cli(process.argv.slice(2));
});
