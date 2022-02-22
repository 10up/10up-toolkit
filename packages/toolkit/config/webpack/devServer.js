module.exports = ({ isPackage, projectConfig: { devServer, hot, devServerPort } }) => {
	if (!devServer && !hot) {
		return undefined;
	}

	if (isPackage && devServer) {
		return {
			contentBase: 'public',
			compress: true,
			port: Number(devServerPort),
		};
	}

	if (!isPackage && hot) {
		return {
			devMiddleware: {
				writeToDisk: true,
			},
			client: {
				webSocketURL: `ws://127.0.0.1:${devServerPort}/ws`,
			},
			headers: {
				// Requests come from the WP port.
				'Access-Control-Allow-Origin': '*',
			},
			// hot: true,
			allowedHosts: 'all',
			host: '0.0.0.0',
			hot: true,
			port: Number(devServerPort),
			proxy: {
				'/dist': {
					pathRewrite: {
						'^/dist': '',
					},
				},
			},
		};
	}

	return undefined;
};
