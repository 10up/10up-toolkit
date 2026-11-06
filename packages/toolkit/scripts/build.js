/**
 * `10up-toolkit build` — production build with Vite+.
 *
 * `10up-toolkit build --watch` is the same as `10up-toolkit watch`.
 */
const { hasArgInCLI } = require('../utils');
const { runVite } = require('../utils/vite');

runVite(hasArgInCLI('--watch') ? 'watch' : 'build')
	.then((code) => process.exit(code))
	.catch((error) => {
		// eslint-disable-next-line no-console
		console.error(error);
		process.exit(1);
	});
