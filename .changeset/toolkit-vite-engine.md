---
'10up-toolkit': major
---

Build with Vite+ and `@10up/wp-vite-plugins` instead of webpack.

`build`, `watch` and `start` keep the same CLI and read the same `"10up-toolkit"` config from package.json, and the dist layout is unchanged. `start --hot` now starts a Vite dev server, bridged into WordPress by `dist/dev-server.php`. `lint-js` and `format-js` run Oxlint and Oxfmt; `test` runs Vitest. Projects can customize the build with a `vite.config.mjs` that starts from `toolkit()` in `10up-toolkit/vite`. Node `^22.18.0` or `>=24.11.0` is required. See UPGRADING.md for what changed and what was removed.
