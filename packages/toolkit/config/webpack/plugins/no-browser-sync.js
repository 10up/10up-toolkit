class NoBrowserSyncPlugin {
	constructor() {
		this.displayed = false;
	}

	// Define `apply` as its prototype method which is supplied with compiler as its argument
	apply(compiler) {
		compiler.hooks.compilation.tap('NoBrowserSyncPlugin', (compilation) => {
			if (!this.displayed) {
				this.displayed = true;
				const logger = compilation.getLogger('10upToolkitBrowserSyncDeprecationNotice');
				logger.warn(
					'BrowserSync suppport has been deprecated in 10up-toolkit in favor of the `--hot` option and will be completely removed in the next major release!',
				);
				logger.warn(
					'If you still wish to use BrowserSync you must manually install the `browser-sync` and `browser-sync-webpack-plugin` packages.',
				);
				logger.warn(
					'If those packages are installed 10up-toolkit will start browser-sync automatically!',
				);
				logger.warn('See https://github.com/10up/10up-toolkit/issues/158 for more info');
			}
		});
	}
}

module.exports = NoBrowserSyncPlugin;
