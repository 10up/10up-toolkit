module.exports = ({ isPackage, projectConfig: { devServer, hot, devServerPort } }) => {
	if (!devServer || !hot) {
		return undefined;
	}

	if (isPackage) {
		return {
			contentBase: 'public',
			compress: true,
			port: Number(devServerPort),
		};
	}

	return {
		devMiddleware: {
			writeToDisk: true,
		},
		headers: {
			// Requests come from the WP port.
			'Access-Control-Allow-Origin': '*',
		},
		hot: true,
		allowedHosts: 'auto',
		host: 'localhost',
		port: Number(devServerPort),
	};
};
