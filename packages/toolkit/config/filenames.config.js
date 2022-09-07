module.exports = ({ projectConfig: { useBlockAssets } }) => ({
	js: 'js/[name].js',
	jsChunk: 'js/[name].[contenthash].chunk.js',
	css: 'css/[name].css',
	block: useBlockAssets ? 'blocks/[name].js' : 'blocks/[name]/editor.js',
	blockCSS: useBlockAssets ? 'blocks/[name].css' : 'blocks/[name]/editor.css',
});
