const stylelint = require('stylelint');
const fs = require('node:fs');
const path = require('path');
const config = require('../../index');

test('allows wp-custom-properties', async () => {
	await expect(
		stylelint.lint({
			config,
			code: fs.readFileSync(path.join(__dirname, 'style.css')).toString(),
		}),
	).resolves.toMatchObject({ errored: false });
});
