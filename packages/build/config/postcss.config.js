/**
 * Default PostCSS configuration for 10up-build
 */

import { sync as glob } from 'fast-glob';
import { resolve } from 'node:path';

export default ({ env }) => {
	const globalStylesDir = resolve(process.cwd(), 'assets/css/globals');
	const globalMixinsDir = resolve(process.cwd(), 'assets/css/mixins');

	const globalCssFiles = glob(`${globalStylesDir}/**/*.css`.replace(/\\/g, '/'));
	const globalMixinFiles = glob(`${globalMixinsDir}/**/*.css`.replace(/\\/g, '/'));

	const config = {
		plugins: {
			'postcss-import': {},
		},
	};

	// Add global data plugin if files exist
	if (globalCssFiles.length > 0) {
		config.plugins['@csstools/postcss-global-data'] = {
			files: globalCssFiles,
		};
	}

	// Add mixins plugin if files exist
	if (globalMixinFiles.length > 0) {
		config.plugins['postcss-mixins'] = {
			mixinsFiles: globalMixinFiles,
		};
	}

	return config;
};
