const path = require('path');
const fs = require('fs');
const babel = require('@babel/core');
const babelPresetDefault = require('../index');

const nodeModulesPath = path.join(__dirname, '../node_modules');
const reactPath = path.join(nodeModulesPath, 'react');

const es6Input = fs.readFileSync(path.join(__dirname, '../fixtures/es6+.js'));
const reactInput = fs.readFileSync(path.join(__dirname, '../fixtures/react.js'));

describe('Babel preset default', () => {
	test('transpiles ES6+ code properly', () => {
		const output = babel.transform(es6Input, {
			configFile: false,
			envName: 'production',
			presets: [babelPresetDefault],
		});

		expect(output.code).toMatchSnapshot();
	});

	test('transpiles ES6+ code properly with runtimeESModules set to true', () => {
		const output = babel.transform(es6Input, {
			configFile: false,
			envName: 'production',
			presets: [[babelPresetDefault, { runtimeESModules: true }]],
		});

		expect(output.code).toMatchSnapshot();
	});

	test('transpiles react code properly', () => {
		const output = babel.transform(reactInput, {
			configFile: false,
			envName: 'production',
			presets: [babelPresetDefault],
		});

		expect(output.code).toMatchSnapshot();
	});

	test('transpiles wordpress code properly', () => {
		const output = babel.transform(reactInput, {
			configFile: false,
			envName: 'production',
			presets: [[babelPresetDefault, { wordpress: true }]],
		});

		expect(output.code).toMatchSnapshot();
	});

	// Babel will automatically set modules to false when called by Webpack.
	test('transpiles without transforming es6 imports', () => {
		const output = babel.transform(es6Input, {
			configFile: false,
			envName: 'production',
			presets: [[babelPresetDefault, { modules: false }]],
		});

		expect(output.code).toMatchSnapshot();
	});

	test('transpiles without removing proptypes in dev mode', () => {
		const output = babel.transform(reactInput, {
			configFile: false,
			envName: 'development',
			presets: [[babelPresetDefault]],
		});

		expect(output.code).toMatchSnapshot();
	});
});

describe('Babel preset default with automatic runtime', () => {
	beforeEach(() => {
		fs.writeFileSync(path.join(reactPath, 'jsx-runtime.js'), 'export default () => {};');
	});

	afterEach(() => {
		fs.unlinkSync(path.join(reactPath, 'jsx-runtime.js'));
	});

	test('transpiles react code properly with automatic runtime', () => {
		const output = babel.transform(reactInput, {
			configFile: false,
			envName: 'production',
			presets: [babelPresetDefault],
		});

		expect(output.code).toMatchSnapshot();
	});

	test('transpiles wordpress code properly even when jsx-runtime.js is present', () => {
		const output = babel.transform(reactInput, {
			configFile: false,
			envName: 'production',
			presets: [[babelPresetDefault, { wordpress: true }]],
		});

		expect(output.code).toMatchSnapshot();
	});
});
