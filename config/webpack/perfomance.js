/**
 * Converts a size vlaue to bytes
 *
 * @param {number} size The size in kb
 *
 * @return {number} The size in bytes
 */
const kb = (size) => {
	return size * 1024;
};

module.exports = () => {
	return {
		maxAssetSize: kb(100),
		maxEntrypointSize: kb(400),
		hints: 'warning',
	};
};
