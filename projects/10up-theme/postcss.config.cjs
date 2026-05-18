/**
 * PostCSS pipeline for the Vite build, mirroring toolkit's setup.
 * Paths are theme-relative (mirrors toolkit's paths.config.js for this project).
 */
const path = require('node:path');
const glob = require('fast-glob');

const themeRoot = __dirname;
const globalsDir = path.join(themeRoot, 'assets/css/globals');
const mixinsDir = path.join(themeRoot, 'assets/css/mixins');

const globalCssFiles = glob.sync(`${globalsDir}/**/*.css`);
const globalMixinFiles = glob.sync(`${mixinsDir}/**/*.css`);

module.exports = (ctx) => ({
	plugins: {
		'postcss-import': {},
		'@csstools/postcss-global-data': {
			files: globalCssFiles,
		},
		'postcss-mixins': {
			mixinsFiles: globalMixinFiles,
		},
		'postcss-preset-env': {
			stage: 0,
			features: {
				'custom-properties': false,
			},
		},
		cssnano:
			ctx.env === 'production'
				? {
						preset: [
							'default',
							{
								autoprefixer: false,
								discardComments: { removeAll: true },
								mergeLonghand: false,
								zindex: false,
							},
						],
					}
				: false,
	},
});
