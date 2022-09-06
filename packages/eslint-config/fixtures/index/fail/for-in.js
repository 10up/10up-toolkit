// Test for selector: 'ForInStatement'
const arr = [1, 2, 3, 4, 5];
const even = [];

for (const i in arr) {
	if (i % 2 === 0) {
		even.push(i);
	}
}
