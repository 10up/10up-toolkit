module.exports = {
	rules: {
		'no-new': 1,
		// no-plusplus--
		'no-plusplus': 0,
		// with ES6 the name of the function can be inferred most of the times.
		'func-names': [0, 'as-needed'],
		// this is hard to follow when the backend does not follow camelcase conventions when sending data.
		camelcase: 0,
		// we want to allow changing object parameters.
		'no-param-reassign': [2, { props: false }],
		'no-shadow': 0,
		'no-underscore-dangle': 0,

		'no-restricted-exports': 0,
		'import/no-commonjs': 0,
	},
};
