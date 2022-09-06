# 10up Eslint Config

> ESLint [shareable config](https://github.com/10up/eslint-config)

[![Support Level](https://img.shields.io/badge/support-active-green.svg)](#support-level)

[@10up/eslint-config](https://github.com/10up/eslint-config) is a shareable configuration package for [eslint](http://eslint.org) built on top of [eslint-airbnb-config](https://github.com/airbnb/javascript) and modified to meet 10up's own standards.

## Installation

Install [@10up/eslint-config](https://github.com/10up/eslint-config) as a development dependency of your project:

```sh
npm install @10up/eslint-config --save-dev
```

## Available ESLint configs

### @10up/eslint-config

The default export contains common rules that are not specific to any framework or environment.

```js
// eslintrc.js
module.exports = {
	extends: ['@10up/eslint-config'],
};
```

### @10up/eslint-config/react

Extends `@10up/eslint-config` adding specific rules to React.

```js
// eslintrc.js
module.exports = {
	extends: ['@10up/eslint-config/react'],
};
```

### @10up/eslint-config/wordpress

Extends `@10up/eslint-config/react` adding the custom gutenberg rules from `@wordpress/eslint-plugin`.

*Note*: This is an optional dependency, if you want to use this set of rules you must install `@wordpress/eslint-plugin` first.

```bash
npm install --save-dev @wordpress/eslint-plugin
```

```js
// eslintrc.js
module.exports = {
	extends: ['@10up/eslint-config/wordpress'],
};
```

### @10up/eslint-config/node

Extends `@10up/eslint-config` adding specific rules to Node.js.

```js
// eslintrc.js
module.exports = {
	extends: ['@10up/eslint-config/node'],
};
```

### @10up/eslint-config/jest

Adds specific rules for the `jest` testing framework.

```js
// eslintrc.js
module.exports = {
	extends: ['@10up/eslint-config/react', '@10up/eslint-config/jest'],
};
```

### @10up/eslint-config/legacy

This legacy config contains only rules for ES5. It should be used for projects without babel that are still writing legacy JavaScript code.

```js
// eslintrc.js
module.exports = {
	extends: ['@10up/eslint-config/legacy'],
};
```

## Usage

In order to use this config, choose the one you want and add this configuration to your `package.json`:

```json
{
    "eslintConfig": {
        "extends": "@10up/eslint-config"
    }
}
```

Or add a `.eslintrc.js` file to your project root containing:
```js
module.exports = {
	extends: ['@10up/eslint-config'],
};
```

## TypeScript Support

If you want TypeScript support, make sure to install `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`

```sh
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

change the eslint parser to `@typescript-eslint/parser` and add the typescript plugin

```js
// eslintrc.js
module.exports = {
	parser: '@typescript-eslint/parser',
	extends: ['@10up/eslint-config/react'],
	plugins: ['@typescript-eslint'],
}
```

## VSCode integration

We recommend turning on VSCode settings to automatically run `eslint --fix` on save.

```json
"editor.codeActionsOnSave": {
   "source.fixAll.eslint": true,
}
```

This will automagically format your code once you save. You don't need VSCode prettier extension enabled or running on save as eslint will automatically run `prettier` for you.

## Support Level

**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850"></a>
