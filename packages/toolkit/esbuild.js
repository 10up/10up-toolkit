require('esbuild').buildSync({
	entryPoints: ['bin/10up-toolkit.js'],
	bundle: true,
	platform: 'node',
	format: 'cjs',
	outfile: 'dist/index.js',
	external: [
		'emitter',
		'pnpapi',
		'file',
		'path',
		'jest-resolve',
		'jest-circus',
		// had issues bundling these
		'webpack-dev-server',
		'browser-sync',
		'mini-css-extract-plugin',
	],
});
