module.exports = ({
	isPackage,
	isModule,
	projectConfig: { devServer, devURL, hot, devServerPort },
}) => {
	if (!devServer && !hot) {
		return undefined;
	}

	if ((isPackage && devServer) || (isModule && devServer)) {
		return {
			compress: true,
			port: Number(devServerPort),
		};
	}

	if ((!isPackage && hot) || (!isModule && hot)) {
		const allowedHosts = ['.test', '.local'];

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
			client: {
				overlay: {
					errors: true,
					warnings: false,
				},
			},
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
