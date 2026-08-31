---
"10up-toolkit": patch
"@10up/babel-preset-default": patch
"@10up/eslint-config": patch
"@10up/stylelint-config": patch
---

Harden the 7.0 release contract for clean downstream installations.

- Raise the effective Node.js minimum to 20.19 to match current build dependencies.
- Keep the Stylelint 15 strict-value plugin on its compatible release line.
- Test packed workspace artifacts with strict peer dependency resolution before release.
