// Check for WebPack Dev Server version with fallback
const { version: webpackDevServerVersion = '0' } = require('webpack-dev-server');

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

		// If WebPack Dev Service version is v5.x.x, use the new proxy configuration
		// Supports Toolkit upgrades where WDS was not updated to v5.x.x
		const distProxyConfiguration = {
			'/dist': {
				pathRewrite: {
					'^/dist': '',
				},
			},
		};
		const proxy = webpackDevServerVersion.startsWith('5.')
			? [distProxyConfiguration]
			: distProxyConfiguration;

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
			proxy,
		};
	}

	return undefined;
};
