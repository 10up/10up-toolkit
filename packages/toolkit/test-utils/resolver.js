const { sync: glob } = require('fast-glob');

let mapping = {};
// Looks for "module-resolution.json" files in all the `__tests__` directories
glob(`${__dirname}/../**/__tests__/modules-resolution.json`).forEach((file) => {
	// For each of them, merges them in the "mapping" object
	mapping = { ...mapping, ...require(file) };
});

function resolver(path, options) {
	// If the path corresponds to a key in the mapping object, returns the fakely resolved path
	// otherwise it calls the Jest's default resolver
	return mapping[path] || options.defaultResolver(path, options);
}

module.exports = resolver;
