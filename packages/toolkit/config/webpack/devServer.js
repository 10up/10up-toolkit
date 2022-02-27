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
		const allowedHosts = ['.test'];

		try {
			allowedHosts.push(new URL(devURL).host);
		} catch (e) {
			// do nothing
		}

		return {
			devMiddleware: {
				writeToDisk: true,
			},
			// by default allow any .test subdomains plus the devURL hostname
			allowedHosts,
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
