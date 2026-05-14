// Do this as the first thing so that any code reading it knows the right env.
process.env.NODE_ENV = 'test';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
	throw err;
});

/**
 * External dependencies
 */
const { execSync } = require('child_process');

/**
 * Internal dependencies
 */
const { getArgsFromCLI } = require('../utils');

const args = getArgsFromCLI();

try {
	execSync(`npx rstest ${args.join(' ')}`, {
		stdio: 'inherit',
		env: { ...process.env },
	});
} catch (e) {
	process.exit(e.status || 1);
}
