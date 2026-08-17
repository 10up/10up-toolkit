---
"@10up/babel-preset-default": major
"@10up/stylelint-config": major
"@10up/eslint-config": major
"10up-toolkit": major
---

Support and default to Node 24

Node 24 (current Active LTS) is now the version the toolkit is developed, tested and released against, and the minimum supported Node version is now 20. Node 16 and 18 are past end-of-life and have been dropped from the test matrix; CI now covers Node 20, 22 and 24.

This is a breaking change only in the sense that `engines` no longer permits Node 16/18. No build, config or API behaviour has changed — see `UPGRADING.md` for details.
