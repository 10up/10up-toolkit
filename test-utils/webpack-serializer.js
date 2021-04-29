const isString = (val) => val && typeof val === 'string';

const hasLocalPath = (val) => val.indexOf(process.cwd()) !== -1;

const isSpecialWebpackPlugin = (val) => {
	return (
		typeof val === 'object' &&
		(val?.key ||
			val?.experimentalUseImportModule ||
			val?.maxConcurrency ||
			val?.options?.experimentalUseImportModule)
	);
};

module.exports = {
	serialize(val) {
		if (isString(val) && hasLocalPath(val)) {
			return `"${val.replace(process.cwd(), '')}"`;
		}

		if (isSpecialWebpackPlugin(val)) {
			delete val?.key;
			delete val?.experimentalUseImportModule;
			delete val?.maxConcurrency;
			delete val?.options?.experimentalUseImportModule;
			return JSON.stringify(val);
		}

		return val;
	},

	test(val) {
		let shouldProcess = isString(val) && hasLocalPath(val);
		shouldProcess ||= isSpecialWebpackPlugin(val);

		return shouldProcess;
	},
};
