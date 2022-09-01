/* eslint-disable no-console */

const shouldNotHappen = true;
if (shouldNotHappen) {
	console.error('Something bad happened!');
	// Should not use process exit.
	process.exit(1);
}
