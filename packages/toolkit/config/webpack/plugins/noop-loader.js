module.exports = function (source, map) {
	this.cacheable();
	this.callback(null, source, map);
};
