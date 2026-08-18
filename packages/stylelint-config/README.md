# 10up Stylelint Config

> At 10up, we strive to provide digital products that yield a top-notch user experience. In order to improve both our efficiency and consistency, we need to standardize what we use and how we use it. This theme scaffold allows us to share initial set up procedures to make sure all projects can get up and running as quickly as possible while closely adhering to 10up's high quality standards.

[![Support Level](https://img.shields.io/badge/support-active-green.svg)](#support-level)


## Dependencies

1. [Node & NPM](https://www.npmjs.com/get-npm) - 3rd party dependencies are managed through NPM, so you will need that installed globally
2. [Stylelint](https://stylelint.io/) - as this is a config extension for Stylelint, you will need Stylelint installed in your main project in order for it to work.

### ⚠️ Dependency Warning

If you're using `npm >= 7` you might not need to install Stylelint directly since it's stated as a `peerDependency`. If you have a version that's not equal or greater than `7`, you'll need to install Stylelint manually.

## Installation

First, install Stylelint:

```bash
// NPM
npm install stylelint --save-dev

// Yarn
yarn add stylelint
```

Then install the 10up Stylelint config:

```bash
// NPM
npm install @10up/stylelint-config --save-dev
```

## Usage

Add the following to your `.stylelintrc` file:

```js
{
  "extends": [
    "@10up/stylelint-config"
  ]
}

```

### SCSS:

By default, 10up Stylelint Config does not support out-the-box support for `scss` based projects. That being said, it is not difficult to add support by following the below process:

Install the `stylelint-config-standard-scss` dependency:

```bash
// NPM
npm install stylelint-config-standard-scss --save-dev
```

You will then need to update the plugins section of your projects `.stylelintrc`:

```json
{
  "extends": [
    "stylelint-config-standard-scss",
    "@10up/stylelint-config/scss"
  ]
}
```

A set of rules are located on the [packages NPM page](https://www.npmjs.com/package/stylelint-config-standard-scss) if you would like to override or customize the defaults further.

#### Selector Nested Pattern

Certain rules that apply to flavours of CSS (`postcss`, `scss`, `sass`, etc) can cause a conflict in your build pipelines. One such rule is
[Selector Nested Pattern](https://stylelint.io/user-guide/rules/selector-nested-pattern).

By default, we ensure that any nested `css` uses a prefixed `&` symbol, as required in languages like `postcss` or `postcss-preset-env`, however you will want to turn this off if using `scss`.

To get around this issue, add the following to your projects, `.stylelintrc`

```js
{
  "rules": [
    "selector-nested-pattern": null,
  ]
}

```

### Webpack Setup
Run `npm install stylelint-webpack-plugin --save-dev`. You should already have the proper loader in `postcss-loader`, but if you don't install that as well. After installing stylelint and the configuration above add the following to your Webpack config:

```js
import StyleLintPlugin from 'stylelint-webpack-plugin';

plugins: [
  new StyleLintPlugin( {
    configFile: ".stylelintrc", // if your config is in a non-standard place
    files: "src/**/*.css", // location of your CSS files
    fix: true, // if you want to auto-fix some of the basic rules
  } ),
]
```

Read more about these options at [stylelint-webpack-plugin](https://github.com/webpack-contrib/stylelint-webpack-plugin), [the main stylelint documentation](https://stylelint.io/) and [postcss-loader](https://github.com/postcss/postcss-loader). That should be all you need, but if there are any errors in this documentation, [please file an issue and let us know](https://github.com/10up/stylelint-config/issues/new)!

## 10up CSS Best Practices Alignment

This configuration enforces the [10up Engineering Best Practices for CSS](https://10up.github.io/Engineering-Best-Practices/css/). Below are the key principles and how they are enforced through linting rules.

### Low Specificity

Keeping specificity low makes CSS more maintainable and easier to override when needed.

**Enforced Rules:**
- `selector-max-specificity: "0,2,1"` - Limits selector specificity to a maximum of 0 IDs, 2 classes/attributes, and 1 element
- `selector-max-id: 0` - Disallows ID selectors for styling (IDs should be reserved for JavaScript hooks and anchors)
- `max-nesting-depth: 2` - Limits nesting to 2 levels maximum (pseudo-classes are excluded from this count)
- `no-descending-specificity: true` - Prevents specificity issues where a less specific selector comes after a more specific one

### Avoid !important

The `!important` declaration should be avoided as it makes CSS harder to maintain and override.

**Enforced Rules:**
- `declaration-no-important: true` - Disallows the use of `!important`

Best practices reserve `!important` for truly exceptional cases, so the rule is enforced as an error by default rather than left advisory. When you hit a genuine exception -- an accessibility override such as `prefers-reduced-motion`, or fighting a third-party stylesheet you do not control -- disable it narrowly at the call site and say why:

```css
@media (prefers-reduced-motion: reduce) {

	/*
	 * `!important` is load-bearing: this override has to win over author
	 * animation declarations everywhere, so it cannot rely on the cascade.
	 */
	*,
	*::before,
	*::after {
		/* stylelint-disable declaration-no-important */
		animation-duration: 0.001s !important;
		transition-duration: 0.001s !important;
		/* stylelint-enable declaration-no-important */
	}
}
```

Prefer a scoped disable over turning the rule off project-wide, so each exception stays visible and justified in review.

### Naming Conventions

Consistent naming makes CSS more readable and maintainable. All names should use kebab-case and be semantic rather than presentational.

**Enforced Rules:**
- `selector-class-pattern` - Enforces kebab-case for class names (e.g., `.button-primary`, `.card-header`), optionally with a BEM `__element` and/or `--modifier` suffix (e.g., `.card__header`, `.card--featured`, `.card__header--compact`). BEM is permitted because 10up best practices list it as a valid methodology to adopt, and because WordPress core block classes rely on it (e.g., `.wp-block-group__inner-container`). camelCase (`.buttonPrimary`) and snake_case (`.button_primary`) are still rejected.
- `keyframes-name-pattern` - Enforces kebab-case for animation names (e.g., `@keyframes fade-in`)
- `selector-id-pattern` - Enforces kebab-case for IDs when they are used
- `custom-property-pattern` - Enforces kebab-case for CSS custom properties, with special support for WordPress preset patterns

### Selector Quality

Writing efficient, maintainable selectors improves performance and reduces specificity issues.

**Enforced Rules:**
- `selector-no-qualifying-type: true` - Prevents qualifying class selectors with type selectors (e.g., `a.button` should be `.button`)
- `shorthand-property-no-redundant-values: true` - Ensures shorthand properties don't contain redundant values (e.g., `margin: 10px 10px` should be `margin: 10px`)

### Additional Best Practices

The configuration also enforces:
- Consistent code formatting through stylistic rules
- Alphabetical ordering of properties for easier scanning
- Strict color value usage (colors should use custom properties)
- Proper quotes around URLs, attribute selectors, and font families

## Overriding Rules

While these rules align with 10up best practices, there may be cases where you need to override specific rules for your project. You can do this in your project's `.stylelintrc`:

```js
{
  "extends": ["@10up/stylelint-config"],
  "rules": {
    // Override specific rules as needed
    "selector-max-specificity": "0,3,2",
    "declaration-no-important": null
  }
}
```

When overriding rules, document the reasoning in your project's CSS architecture documentation to maintain clarity for future maintainers.

## Autofixing

Certain rules and violations can be fixed automatically using the `--fix` flag via the command line.
To ensure that Stylelint fixes what it can, you can run:

```bash
stylelint path/to/css/file.css --fix
```
