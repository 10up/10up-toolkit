const target = require('../target');

describe('target module function', () => {
	it('respects the target config', () => {
		expect(target({ packageConfig: { target: 'node' }, projectConfig: {} })).toBe('node');
	});

	it('returns the proper target for module output', () => {
		expect(target({ packageConfig: { packageType: 'module' }, projectConfig: {} })).toBe(
			'es2020',
		);
	});

	it('returns defaultTargets', () => {
		expect(
			target({
				defaultTargets: ['> 1%', 'Firefox ESR'],
				packageConfig: {},
				projectConfig: {},
			}),
		).toBe('browserslist:> 1%, Firefox ESR');
	});
});
