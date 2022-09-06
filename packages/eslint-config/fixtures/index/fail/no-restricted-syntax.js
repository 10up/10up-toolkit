/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */

const arr = [1, 2, 3, 4, 5];

// test for selector: 'ForInStatement'
for (const i in arr) {
	if (i % 2 === 0) {
		console.log(i);
	}
}

// test for selector: 'LabeledStatement'
labelStart

for (const i in arr) {
	if (i % 2 === 0) {
		 goto labelStart;
	}
}

// test for selector: 'WithStatement'
with({ first: "John" }) {
	console.log(`Hello ${first}`);
}
