/* eslint-disable no-unused-vars */

// calling require() inside of a function is not allowed
function readFile(filename, callback) {
	const fs = require('fs');
	fs.readFile(filename, callback);
}
