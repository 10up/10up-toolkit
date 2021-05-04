const constVar = 'someConstVar';

const promise = new Promise((resolve) => {
	setTimeout(() => {
		resolve(`Resolving ${constVar}`);
	}, 100);
});

function* generator() {
	yield 1;
	yield 2;
	yield 3;
}

const object = {
	a: {
		b: 'b',
	},
	b: {
		a: 'a',
	},
};
const init = async () => {
	const result = await promise();

	for (const a of generator()) {
		console.log(a);
	}

	console.log(object?.a?.b);

	return result;
};

init().then((result) => {
	console.log(result);
});
