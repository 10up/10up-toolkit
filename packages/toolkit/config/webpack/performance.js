/**
 * Converts a size value to bytes
 *
 * @param {number} size The size in kb
 *
 * @returns {number} The size in bytes
 */
const kb = (size) => {
	return size * 1024;
};

module.exports = ({ mode }) => {
	if (mode === 'production') {
		return {
			maxAssetSize: kb(100),
			maxEntrypointSize: kb(400),
			hints: 'warning',
		};
	}

	return {
		maxAssetSize: kb(10000),
		maxEntrypointSize: kb(40000),
		hints: 'warning',
	};
};
