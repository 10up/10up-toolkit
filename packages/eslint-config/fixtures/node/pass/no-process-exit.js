/* eslint-disable no-console */
/* eslint-disable no-constant-condition */

const shouldNotHappen = true;
if (shouldNotHappen) {
	console.error('Something bad happened!');
	// Should not use process exit. Use throw instead.
	throw new Error('Something bad happened!');
}
