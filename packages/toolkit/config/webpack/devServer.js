module.exports = ({ isPackage, projectConfig: { devServer, devURL, devServerPort } }) => {
	if (isPackage && devServer) {
		return {
			contentBase: 'public',
			compress: true,
			port: Number(devServerPort),
		};
	}

	if (!devURL) {
		return undefined;
	}

	return {
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
		hot: true,
		watchOptions: {
			aggregateTimeout: 300,
		},
		stats: {
			all: false,
			assets: true,
			colors: true,
			errors: true,
			performance: true,
			timings: true,
			warnings: true,
		},
		https: true,
		proxy: {
			'*': {
				target: devURL,
				secure: false,
				changeOrigin: true,
				autoRewrite: true,
				headers: {
					'X-ProxiedBy-Webpack': true,
				},
			},
		},
		port: 8080,
	};
};
