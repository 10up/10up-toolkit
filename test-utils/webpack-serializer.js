module.exports = {
	serialize(val) {
		return `"${val.replace(process.cwd(), '')}"`;
	},

	test(val) {
		return val && typeof val === 'string' && val.indexOf(process.cwd()) !== -1;
	},
};
