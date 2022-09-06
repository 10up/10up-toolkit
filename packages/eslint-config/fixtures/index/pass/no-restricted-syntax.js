const arr = [1, 2, 3, 4, 5];
const even = [];

// test for selector: 'ForOf'
for (const value of arr) {
	if (value % 2 === 0) {
		even.push(value);
	}
}
