const path = require('path');
const glob = require('fast-glob');

const { getTenUpScriptsConfig } = require('../utils');

module.exports = ({ file, env }) => {
	const projectConfig = getTenUpScriptsConfig();
	const { globalStylesDir, globalMixinsDir } = projectConfig.paths;

	const globalCssFiles = glob.sync(`${globalStylesDir}**/*.css`);
	const globalMixinFiles = glob.sync(`${globalMixinsDir}**/*.css`);

	const config = {
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
		},
	};

	// Only load postcss-editor-styles plugin when we're processing the editor-style.css file.
	if (path.basename(file) === 'editor-style.css') {
		config.plugins['postcss-editor-styles-wrapper'] = {
			scopeTo: '.editor-styles-wrapper',
			ignore: [':root', '.edit-post-visual-editor.editor-styles-wrapper', '.wp-toolbar'],
			remove: ['html', ':disabled', '[readonly]', '[disabled]'],
			tags: ['button', 'input', 'label', 'select', 'textarea', 'form'],
		};
	}

	config.plugins.cssnano =
		env === 'production'
			? {
					preset: [
						'default',
						{
							autoprefixer: false,
							calc: {
								precision: 8,
							},
							convertValues: true,
							discardComments: {
								removeAll: true,
							},
							mergeLonghand: false,
							zindex: false,
						},
					],
				}
			: false;

	return config;
};
