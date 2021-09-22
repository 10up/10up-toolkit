const { relative, resolve } = require('path');

const externals = {
	'jest-worker': 'jest-worker',
	chalk: 'chalk',
	browserslist: 'browserslist',
	'caniuse-lite': 'caniuse-lite',
	'caniuse-lite/data/features/border-radius': 'caniuse-lite/data/features/border-radius',
	'caniuse-lite/data/features/css-featurequeries.js':
		'caniuse-lite/data/features/css-featurequeries',
	postcss: 'postcss',
	lodash: 'lodash',
};

externals['webpack-sources'] = '../../compiled/webpack-sources';
export async function ncc_webpack_sources(task) {
	await task
		.source(relative(__dirname, require.resolve('webpack-sources')))
		.ncc({ externals })
		.target('compiled/webpack-sources');
}

externals['schema-utils'] = '../../compiled/schema-utils';
export async function ncc_schema_utils(task) {
	await task
		.source(relative(__dirname, require.resolve('schema-utils')))
		.ncc({ externals })
		.target('compiled/schema-utils');
}

externals.webpack = '../../compiled/webpack';
export async function ncc_webpack(task) {
	await task
		.source(relative(__dirname, require.resolve('webpack')))
		.ncc({ externals })
		.target('compiled/webpack');
}

// externals['mini-css-extract-plugin'] = '../../compiled/mini-css-extract-plugin';
export async function ncc_mini_css_extract_plugin(task, opts) {
	await task
		.source(
			relative(__dirname, resolve(require.resolve('mini-css-extract-plugin'), '../index.js')),
		)
		.ncc({
			externals: {
				...externals,
				'./index': './index.js',
			},
		})
		.target('compiled/mini-css-extract-plugin');
	await task
		.source(opts.src || relative(__dirname, require.resolve('mini-css-extract-plugin')))
		.ncc({
			packageName: 'mini-css-extract-plugin',
			externals: {
				...externals,
				'./index': './index.js',
			},
		})
		.target('compiled/mini-css-extract-plugin');
}

externals['terser-webpack-plugin'] = 'compiled/terser-webpack-plugin';
export async function ncc_terser_webpack_plugin(task) {
	await task
		.source(relative(__dirname, require.resolve('terser-webpack-plugin')))
		.ncc({
			packageName: 'terser-webpack-plugin',
		})
		.target('compiled/terser-webpack-plugin');
}

externals['copy-webpack-plugin'] = '../../compiled/copy-webpack-plugin';
externals['imagemin-webpack-plugin'] = '../../compiled/imagemin-webpack-plugin';
externals['eslint-webpack-plugin'] = '../../compiled/eslint-webpack-plugin';
externals['stylelint-webpack-plugin'] = '../../compiled/stylelint-webpack-plugin';
externals['html-webpack-plugin'] = '../../compiled/html-webpack-plugin';
externals['webpack-remove-empty-scripts'] = '../../compiled/webpack-remove-empty-scripts';
externals.webpackbar = '../../compiled/webpackbar';

export async function ncc_copy_webpack_plugin(task) {
	await task
		.source(relative(__dirname, require.resolve('copy-webpack-plugin')))
		.ncc({ packageName: 'copy-webpack-plugin', externals })
		.target('compiled/copy-webpack-plugin');
}

export async function ncc_webpack_imagemin_plugin(task) {
	await task
		.source(relative(__dirname, require.resolve('imagemin-webpack-plugin')))
		.ncc({ externals })
		.target('compiled/imagemin-webpack-plugin');
}

export async function ncc_eslint_webpack_plugin(task) {
	await task
		.source(relative(__dirname, require.resolve('eslint-webpack-plugin')))
		.ncc({ packageName: 'eslint-webpack-plugin', externals })
		.target('compiled/eslint-webpack-plugin');
}

export async function ncc_stylelint_webpack_plugin(task) {
	await task
		.source(relative(__dirname, require.resolve('stylelint-webpack-plugin')))
		.ncc({ packageName: 'stylelint-webpack-plugin', externals, target: 'es5' })
		.target('compiled/stylelint-webpack-plugin');
}

export async function ncc_html_webpack_plugin(task) {
	await task
		.source(relative(__dirname, require.resolve('html-webpack-plugin')))
		.ncc({ externals, target: 'es5' })
		.target('compiled/html-webpack-plugin');
}

export async function ncc_webpackbar(task) {
	await task
		.source(relative(__dirname, require.resolve('webpackbar')))
		.ncc({ packageName: 'webpackbar', externals })
		.target('compiled/webpackbar');
}

export async function ncc_webpack_remove_empty_scripts(task) {
	await task
		.source(relative(__dirname, require.resolve('webpack-remove-empty-scripts')))
		.ncc({ externals })
		.target('compiled/webpack-remove-empty-scripts');
}

externals['cross-spawn'] = '../../compiled/cross-spawn';
export async function ncc_cross_spawn(task) {
	await task
		.source(relative(__dirname, require.resolve('cross-spawn')))
		.ncc({ externals })
		.target('compiled/cross-spawn');
}

externals['@wordpress/dependency-extraction-webpack-plugin'] =
	'../../compiled/@wordpress-dependency-extraction-webpack-plugin';
export async function ncc_wp_dependency_extraction_plugin(task) {
	await task
		.source(
			relative(__dirname, require.resolve('@wordpress/dependency-extraction-webpack-plugin')),
		)
		.ncc({ externals })
		.target('compiled/@wordpress-dependency-extraction-webpack-plugin');
}

externals['webpack-dev-server'] = '../../compiled/webpack-dev-server';
export async function ncc_webpack_dev_server(task) {
	await task
		.source(relative(__dirname, require.resolve('ebpack-dev-server')))
		.ncc({ externals })
		.target('compiled/webpack-dev-server');
}

externals['thread-loader'] = '../../compiled/thread-loader';
export async function ncc_thread_loader(task) {
	await task
		.source(relative(__dirname, require.resolve('thread-loader')))
		.ncc({ externals, packageName: 'thread-loader', assetBuilds: true })
		.target('compiled/thread-loader');
}

externals['babel-loader'] = '../../compiled/babel-loader';
export async function ncc_babel_loader(task) {
	await task
		.source(relative(__dirname, require.resolve('babel-loader')))
		.ncc({ externals })
		.target('compiled/babel-loader');
}

export async function ncc(task, opts) {
	await task.clear('compiled').parallel(
		[
			'ncc_webpack_sources',
			'ncc_schema_utils',
			'ncc_webpack',
			// 'ncc_mini_css_extract_plugin',
			'ncc_copy_webpack_plugin',
			'ncc_webpack_imagemin_plugin',
			'ncc_eslint_webpack_plugin',
			'ncc_stylelint_webpack_plugin',
			'ncc_html_webpack_plugin',
			'ncc_webpackbar',
			'ncc_webpack_remove_empty_scripts',
			'ncc_cross_spawn',
			'ncc_terser_webpack_plugin',
			'ncc_wp_dependency_extraction_plugin',
			'ncc_thread_loader',
			'ncc_babel_loader',
			// 'ncc_webpack_dev_server',
		],
		opts,
	);
}
