# Upgrade Guide

## Upgrading from 3 to 4

If you're on version 3 and followed below to be on (at least) NPM version `7`, you should be in the clears for this upgrade. In the case you're not, you'll need to install all of these dependencies manually into the project where toolkit is used given that it's only from NPM 7 that `peerDependency` are handled automatically.

* `@10up/babel-preset-default`
* `@10up/eslint-config`
* `@10up/stylelint-config`
* `eslint`
* `eslint-config-airbnb`
* `eslint-config-airbnb-base`
* `eslint-config-prettier`
* `eslint-plugin-import`
* `eslint-plugin-jest`
* `eslint-plugin-jsdoc`
* `eslint-plugin-jsx-a11y`
* `eslint-plugin-prettier`
* `eslint-plugin-react`
* `eslint-plugin-react-hooks`
* `eslint-webpack-plugin`
* `prettier`
* `stylelint`

We're aiming to reduce major version releases with this change, decoupling Stylelint, Eslint and Prettier cycle's from Toolkit's cycles as we move forward. With this change it's possible to stay on Stylelint 13 if you depend on `@10up/stylelint-config` version `^1.0.0` or upgrade to Stylelint 14 if you use version `^2.0.0`.

## Upgrading from 2 to 3

### Minimum Node.js version

The minimum Node.js version is 12.x, however Node.js 16 is strongly recommended.

### Minimum NPM version

In theory 10up-toolkit can be installed with any npm version >= 6, however we don't recommend npm < 7. 

~~If you're getting an install error due to conflicting prettier dependencies, we recommend updating to npm 8.  There's an [known issue](https://github.com/WordPress/gutenberg/issues/39208) with `@wordpress/eslint-plugin` that can break installations of 10up-toolkit when using npm < 8. Alternatively if you're not on npm 8, you can try pinning `prettier` to `2.4.1` in your package.json to force npm install the version toolkit uses.~~ Fixed in [#166](https://github.com/10up/10up-toolkit/pull/166)

### BrowserSync packages have been removed by default.

With the introduction of Hot Module Reload and React Fast Refresh, browser-sync has been deprecated in 10up-toolkit. However, if you wish to continue using browser sync while migrating to HMR & Fast Refresh, you can do so by installing `browser-sync` and `browser-sync-webpack-plugin`.

```
npm install --save-dev browser-sync browser-sync-webpack-plugin
```

If you're using NPM workspaces, make sure to specify the desired workspace.

```
npm install --save-dev browser-sync browser-sync-webpack-plugin -w=workspace-name
```

Browser sync will be automatically enabled if a `devURL` is specified and those packages are installed when you run `10up-toolkit watch` and `10up-tooking start`.

### The post css plugin `postcss-object-fit-image` has been removed

The post css plugin `postcss-object-fit-image` is no longer needed since we stopped supporting IE 11. If you are extending the `postcss.config.js` file and including that plugin you will need to remove from the list of plugins.

Note that the recommended way of extending `postcss.config.js` is as follows:

```javascript
const baseConfig = require('10up-toolkit/config/postcss.config.js');

module.exports = (props) => {
    const config = baseConfig(props);

    // do what you want with the config object

    return config;
};
```

So if you are just adding new things to the config you might not need to do anything as the removed plugin would come from the default config.

## `imagemin-webpack-plugin` and `imagemin` have been replaced

`imagemin-webpack-plugin` and `imagemin` have been replaced with `image-minimizer-webpack-plugin` and `squoosh`.

If you are extending the webpack config and making use of `imagemin-webpack-plugin` and `imagemin` you will need to change your webpack config.

If you want to extend your webpack config to optimize additional files you can do so the following way:

```javascript
const config = require('10up-toolkit/config/webpack.config.js');

config.optimization.minimizer.push(
    new ImageMinimizerPlugin({
        test: 'regex',
        minimizer: [
            {
                implementation: /* add a custom minimizer implementation */,
            },
        ],
    })
);
return config;
```

**IMPORTANT**: If you were extending the webpack config to change how svgs are optimized (such as prevent removing viewBox), 10up-toolkit no longer strips viewbox from svgs.

## HMR & Fast Refresh

Check out the [docs](./README.md#fast-refresh) for guidance on how to enable HMR and Fast Refresh.

Additionally, check out this [PR](https://github.com/10up/wp-scaffold/pull/87) that enables HMR & Fast Refresh in 10up's wp-scaffold.
