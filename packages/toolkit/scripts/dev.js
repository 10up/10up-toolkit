/**
 * `10up-toolkit dev` — start a Vite dev server. Same as `start --hot`.
 */
const { runVite } = require('../utils/vite');

runVite('dev')
	.then((code) => process.exit(code))
	.catch((error) => {
		// eslint-disable-next-line no-console
		console.error(error);
		process.exit(1);
	});
