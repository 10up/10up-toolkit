import {
	getDefaultConfig,
	getTenUpScriptsConfig,
	getTenUpScriptsPackageBuildConfig,
} from '../config';
import { getPackage as getPackageMock } from '../package';

jest.mock('../package', () => {
	const module = jest.requireActual('../package');

	jest.spyOn(module, 'getPackage');

	return module;
});

describe('getTenUpScriptsConfig', () => {
	afterEach(() => {
		getPackageMock.mockReset();
	});

	it('returns defaults values if config is not set', () => {
		getPackageMock.mockReturnValueOnce({});

		expect(getTenUpScriptsConfig()).toEqual(getDefaultConfig());
	});

	it('overrides and merges config properly', () => {
		getPackageMock.mockReturnValueOnce({
			'@10up/scripts': {
				entry: {
					'entry1.js': 'dist/output.js',
				},
				filenames: {
					blockCSS: 'blocks/[name]/editor2.css',
				},
				paths: {
					srcDir: './assets2/',
				},
			},
		});

		const defaultConfig = getDefaultConfig();

		expect(getTenUpScriptsConfig()).toEqual({
			...defaultConfig,
			entry: {
				'entry1.js': 'dist/output.js',
			},
			filenames: {
				...defaultConfig.filenames,
				blockCSS: 'blocks/[name]/editor2.css',
			},
			paths: {
				...defaultConfig.paths,
				srcDir: './assets2/',
			},
		});
	});
});

describe('getTenUpScriptsPackageBuildConfig', () => {
	afterEach(() => {
		getPackageMock.mockReset();
	});

	it('returns valid package build config', () => {
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			'umd:main': 'src/index.umd.js',
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
		});

		expect(getTenUpScriptsPackageBuildConfig()).toEqual({
			source: 'src/index.js',
			main: 'dist/index.js',
			umd: 'src/index.umd.js',
			externals: ['read-pkg', 'read-pkg-up', 'resolve-bin'],
			libraryName: 'componentLibrary',
		});

		getPackageMock.mockReset();

		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			'umd:main': 'src/index.umd.js',
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
			'@10up/scripts': {
				libraryName: 'myComponentLibrary',
			},
		});

		expect(getTenUpScriptsPackageBuildConfig()).toEqual({
			source: 'src/index.js',
			main: 'dist/index.js',
			umd: 'src/index.umd.js',
			externals: ['read-pkg', 'read-pkg-up', 'resolve-bin'],
			libraryName: 'myComponentLibrary',
		});
	});
});
