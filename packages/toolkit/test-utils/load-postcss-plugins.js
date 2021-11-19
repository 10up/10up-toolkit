const loadPostCSSPlugins = (config) => {
	const { plugins } = config;

	const pluginKeys = Object.keys(config.plugins);
	const pluginsArray = [];
	pluginKeys.forEach((pluginName) => {
		const pluginConfig = plugins[pluginName];

		if (!pluginConfig) {
			return;
		}

		const module = require(pluginName);

		if (module.default) {
			pluginsArray.push(module.default(pluginConfig));
		} else {
			pluginsArray.push(module(pluginConfig));
		}
	});

	return pluginsArray;
};

module.exports = {
	loadPostCSSPlugins,
};
