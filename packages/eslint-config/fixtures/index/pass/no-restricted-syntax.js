/* eslint-disable no-console */

const arr = [1, 2, 3, 4, 5];

// test for selector: 'ForInStatement'
arr.forEach((value) => {
	if (value % 2 === 0) {
		console.log(value);
	}
});
