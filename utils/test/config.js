import { getDefaultConfig, getTenUpScriptsConfig } from '../config';
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
