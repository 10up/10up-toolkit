module.exports = ({ isPackage, projectConfig: { devServer, devURL, hot, devServerPort } }) => {
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
		let hostName = '';
		try {
			hostName = new URL(devURL).host;
		} catch (e) {
			hostName = devURL;
		}

		return {
			devMiddleware: {
				writeToDisk: true,
			},
			// by default allow any .test subdomains plus the devURL hostname
			allowedHosts: ['.test', hostName],
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
