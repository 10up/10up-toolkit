module.exports = (api) => {
	// This caches the Babel config
	api.cache.using(() => process.env.NODE_ENV);
	return {
		presets: [
			['@10up/babel-preset-default', { wordpress: true }],
			require.resolve('@linaria/babel-preset'),
		],
		// Applies the react-refresh Babel plugin on non-production modes only
		// ...(!api.env('production') && { plugins: ['react-refresh/babel'] }),
	};
};
