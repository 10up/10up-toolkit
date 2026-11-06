/**
 * `10up-toolkit start` — rebuild on change with Vite+.
 *
 * With `--hot` or `--dev-server`, start a Vite dev server instead. Every
 * build writes `dist/dev-server.php`; while the dev server runs, that file
 * points WordPress at it.
 */
const { hasArgInCLI } = require('../utils');
const { runVite } = require('../utils/vite');

const useDevServer = hasArgInCLI('--hot') || hasArgInCLI('--dev-server');

runVite(useDevServer ? 'dev' : 'watch')
	.then((code) => process.exit(code))
	.catch((error) => {
		// eslint-disable-next-line no-console
		console.error(error);
		process.exit(1);
	});
