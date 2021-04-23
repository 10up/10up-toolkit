# Changelog

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## 1.3.3
- Disables webpack css-loader url resolution [#39](https://github.com/10up/10up-scripts/pull/39)
- Only load and run the postcss-editor-styles plugin when processing editor-style.css [#41](https://github.com/10up/10up-scripts/pull/41)

## 1.3.2
- Fixes a bug where webpack was not targeting the same browsers as babel, causing code to not run on older browsers like IE 11. [#35](https://github.com/10up/10up-scripts/pull/35)
- Updates eslint to 2.3.4 to address [#27](https://github.com/10up/10up-scripts/issues/27)
- Updates postcss.config.js to include missing packages and to fix a bug where editor styles wasn't being wrapped with the `.editor-styles-wrapper` class.