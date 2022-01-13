const postcss = require('postcss');
const fs = require('fs');
const path = require('path');
const configFactory = require('../postcss.config');
const { loadPostCSSPlugins } = require('../../test-utils/load-postcss-plugins');

describe('postcss.config.js', () => {
	it('builds a proper postcss config file for editor styles', () => {
		expect(
			configFactory({
				file: '/path/to/editor-style.css',
				env: 'production',
			}),
		).toMatchSnapshot('env=production');

		expect(
			configFactory({
				file: '/path/to/editor-style.css',
				env: 'development',
			}),
		).toMatchSnapshot('env=development');
	});

	it('build a proper postcss config file for non-editor styles', () => {
		expect(
			configFactory({
				file: '/path/to/regular.css',
				env: 'production',
			}),
		).toMatchSnapshot('env=production');

		expect(
			configFactory({
				file: '/path/to/regular.css',
				env: 'development',
			}),
		).toMatchSnapshot('env=development');
	});
});

describe('postcss', () => {
	const config = configFactory({
		// this is just to control the postcss config based on file name
		file: 'style.css',
		env: 'development',
	});

	const postCSSPlugins = loadPostCSSPlugins(config);

	it('properly transforms css', async () => {
		const css = fs.readFileSync(path.join(__dirname, '__fixtures__', 'styleguide.css'));
		const result = await postcss(postCSSPlugins).process(css, {
			from: 'styleguide.css',
			to: 'styleguide.out.css',
		});

		expect(result.css).toMatchSnapshot();
	});

	it('transforms mixins properly', async () => {
		const css = fs.readFileSync(path.join(__dirname, '__fixtures__', 'mixins.css'));

		const result = await postcss(postCSSPlugins).process(css, {
			from: 'mixins.css',
			to: 'mixins.out.css',
		});

		expect(result.css).toMatchSnapshot();
	});

	it('transforms accordion.css properly', async () => {
		const css = fs.readFileSync(path.join(__dirname, '__fixtures__', 'accordion.css'));

		const result = await postcss(postCSSPlugins).process(css, {
			from: 'accordion.css',
			to: 'accordion.out.css',
		});

		expect(result.css).toMatchSnapshot();
	});

	it('transforms nesting.css properly', async () => {
		const css = fs.readFileSync(path.join(__dirname, '__fixtures__', 'nesting.css'));

		const result = await postcss(postCSSPlugins).process(css, {
			from: 'nesting.css',
			to: 'nesting.out.css',
		});

		expect(result.css).toMatchSnapshot();
	});
});
