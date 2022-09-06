// Test for labeled statements'
function myLabelTest() {
	let i;
	let j;
	let result;

	loop1: for (i = 0; i < 3; i++) {
		for (j = 0; j < 3; j++) {
			if (i === 1 && j === 1) {
				break loop1;
			}
			result = `i = ${i}, j = ${j}`;
		}
	}

	return result;
}

export default myLabelTest();
