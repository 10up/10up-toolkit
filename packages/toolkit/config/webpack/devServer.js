// Check for WebPack Dev Server version with fallback
const { version: webpackDevServerVersion = '0' } = require('webpack-dev-server');
const { isMinimumPackageVersion } = require('../../utils');

const MIN_WDS_VERSION = '5.2.2';
if (!isMinimumPackageVersion(webpackDevServerVersion, MIN_WDS_VERSION)) {
	// eslint-disable-next-line no-console -- runtime warning for incompatible peer
	console.warn(
		`[10up-toolkit] webpack-dev-server ${webpackDevServerVersion} was resolved; ${MIN_WDS_VERSION} or newer is recommended.\n` +
			'  If you used --legacy-peer-deps or have an older version in your tree, install a matching version:\n' +
			'  npm install --save-dev webpack-dev-server@^5.2.2',
	);
}

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
