class NoBrowserSyncPlugin {
	constructor() {
		this.displayed = false;
	}

	apply(compiler) {
		compiler.hooks.compilation.tap('NoBrowserSyncPlugin', (compilation) => {
			if (!this.displayed) {
				this.displayed = true;
				const logger = compilation.getLogger('10upToolkitBrowserSyncDeprecationNotice');
				logger.warn(
					'BrowserSync support has been deprecated in 10up-toolkit in favor of the `--hot` option.',
				);
				logger.warn(
					'If you still wish to use BrowserSync you must manually install the `browser-sync` and `browser-sync-webpack-plugin` packages.',
				);
				logger.warn(
					'If those packages are installed 10up-toolkit will start browser-sync automatically.',
				);
			}
		});
	}
}

module.exports = NoBrowserSyncPlugin;
