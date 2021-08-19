const fs = require('fs');
const path = require('path');
const { build } = require('esbuild');

const filesToBundleSeparately = [];

function escapeRegExp(string) {
	return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function replaceAll(str, find, replace) {
	return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

const requireResolvePlugin = {
	name: 'require-resolve-plugin',
	setup(build) {
		build.onLoad({ filter: /\.js$/, namespace: 'file' }, async (args) => {
			let file = await fs.promises.readFile(args.path, 'utf-8');
			const results = file.matchAll(/require\.resolve\([`'"](.*)[`"']\)/g);

			const matches = results ? [...results] : [];

			if (matches.length) {
				matches.forEach((match) => {
					const requireResolvePath = match[1];
					const preamble = requireResolvePath.slice(0, 2);
					const isRelative = ['./', '..'].includes(preamble);

					if (isRelative) {
						const pathToRequireResolveFile = require.resolve(requireResolvePath, {
							paths: [path.dirname(args.path)],
						});

						const results = pathToRequireResolveFile.match(
							/.*\/10up-toolkit\/node_modules\/(.*)/,
						);

						if (results) {
							const [, filePath] = results;

							const toReplaceSingle = `require.resolve('${requireResolvePath}')`;
							const toReplaceDouble = `require.resolve("${requireResolvePath}")`;
							const replaceWith = `require.resolve('./${filePath}')`;

							// console.log('replacing file contents', toReplace, replaceWith);

							// file = file.replace(new RegExp(toReplace, 'g'), replaceWith);
							file = replaceAll(file, toReplaceSingle, replaceWith);
							file = replaceAll(file, toReplaceDouble, replaceWith);
							// console.log(file);
							// console.log(file)

							// console.log(path.dirname(args.path));
							// console.log(isRelative, requireResolvePath);
							filesToBundleSeparately.push({
								args,
								file: pathToRequireResolveFile,
							});
						}
					}
				});
			}

			return {
				contents: file,
				loader: 'js',
			};
		});
	},
};

build({
	entryPoints: ['bin/10up-toolkit.js'],
	bundle: true,
	platform: 'node',
	format: 'cjs',
	outfile: 'dist/index.js',
	plugins: [requireResolvePlugin],
	external: [
		'emitter',
		'pnpapi',
		'file',
		'path',
		// had issues bundling these
		// see https://github.com/evanw/esbuild/issues/1311
		// 'jest-resolve',
		// 'jest-circus',
		'jest',
		// fails bc of a dynamic require
		'webpack-dev-server',
		// no idea why this one fails, but waant to get rid of it anyway
		'browser-sync',
	],
}).then(async () => {
	const entryPoints = filesToBundleSeparately.map(({ file }) => file);
	build({
		entryPoints,
		bundle: true,
		platform: 'node',
		format: 'cjs',
		outdir: 'dist',
		external: ['emitter', 'pnpapi', 'file', 'path', 'jest-resolve', 'jest-circus'],
	});
});
