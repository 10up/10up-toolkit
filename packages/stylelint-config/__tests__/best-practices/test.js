const stylelint = require('stylelint');
const config = require('../../index');

describe('10up CSS Best Practices', () => {
	describe('Specificity Rules', () => {
		test('allows low specificity selectors (0,2,1)', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.button { color: red; }
.card .title { color: blue; }
.nav > li { color: green; }
				`,
			});
			expect(result.errored).toBe(false);
		});

		test('rejects high specificity selectors', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.nav .list .item .link { color: red; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('selector-max-specificity');
		});

		test('rejects ID selectors', async () => {
			const result = await stylelint.lint({
				config,
				code: `
#header { color: red; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('selector-max-id');
		});

		test('rejects deep nesting beyond 2 levels', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.nav {
	.list {
		.item {
			color: red;
		}
	}
}
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('max-nesting-depth');
		});

		test('allows nesting up to 2 levels', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.nav {
	.list {
		color: red;
	}
}
				`,
			});
			expect(result.errored).toBe(false);
		});
	});

	describe('Importance Rules', () => {
		test('rejects !important declarations', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.button { color: red !important; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('declaration-no-important');
		});

		test('detects descending specificity issues', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.button.primary { color: red; }
.button { color: blue; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('no-descending-specificity');
		});
	});

	describe('Naming Conventions', () => {
		test('allows kebab-case class names', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.button-primary { color: red; }
.card-header-title { color: blue; }
				`,
			});
			expect(result.errored).toBe(false);
		});

		test('rejects camelCase class names', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.buttonPrimary { color: red; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('selector-class-pattern');
		});

		test('rejects snake_case class names', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.button_primary { color: red; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('selector-class-pattern');
		});

		test('allows kebab-case keyframe names', async () => {
			const result = await stylelint.lint({
				config,
				code: `
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
				`,
			});
			expect(result.errored).toBe(false);
		});

		test('rejects camelCase keyframe names', async () => {
			const result = await stylelint.lint({
				config,
				code: `
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('keyframes-name-pattern');
		});
	});

	describe('Selector Quality Rules', () => {
		test('rejects type selectors qualifying class selectors', async () => {
			const result = await stylelint.lint({
				config,
				code: `
a.button { color: red; }
div.card { color: blue; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe('selector-no-qualifying-type');
		});

		test('allows type selectors with attribute selectors', async () => {
			const result = await stylelint.lint({
				config,
				code: `
input[type="text"] { border: 1px solid; }
				`,
			});
			expect(result.errored).toBe(false);
		});

		test('detects redundant shorthand values', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.button { margin: 10px 10px 10px 10px; }
				`,
			});
			expect(result.errored).toBe(true);
			expect(result.results[0].warnings[0].rule).toBe(
				'shorthand-property-no-redundant-values',
			);
		});

		test('allows non-redundant shorthand values', async () => {
			const result = await stylelint.lint({
				config,
				code: `
.button { margin: 10px 20px; }
.card { padding: 10px 20px 30px; }
				`,
			});
			expect(result.errored).toBe(false);
		});
	});
});
