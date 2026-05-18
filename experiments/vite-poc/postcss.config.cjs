/**
 * PostCSS pipeline mirroring toolkit's current setup. Vite picks this up
 * automatically because it sits at the project root.
 *
 * Pipeline (order matters):
 *   1. postcss-import         — resolve `@import` at build time
 *   2. postcss-global-data    — make declared globals available without per-file imports
 *   3. postcss-mixins         — `@define-mixin` / `@mixin` (toolkit's mixin layer)
 *   4. postcss-preset-env     — modern CSS (nesting, color fns, etc.), stage 0
 *   5. cssnano                — production-only minify
 */
const path = require('node:path');
const glob = require('fast-glob');

const fixtureRoot = path.resolve(__dirname, 'fixture-plugin');

const globalsDir = path.join(fixtureRoot, 'assets/css/globals');
const mixinsDir = path.join(fixtureRoot, 'assets/css/mixins');

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
