# 10up Toolkit

> A collection of tools for building projects at 10up.

> [!WARNING]
> **10up-toolkit is in maintenance mode.** It will get security fixes for now, and will later be deprecated and archived. New projects should build with [Vite+](https://viteplus.dev) and [`@10up/wp-vite-plugins`](https://github.com/10up/wp-tooling/tree/trunk/packages/wp-vite-plugins) from [10up/wp-tooling](https://github.com/10up/wp-tooling). To move an existing project, follow [Migrating from 10up-toolkit](https://github.com/10up/wp-tooling/blob/trunk/packages/wp-vite-plugins/docs/migrating-from-toolkit.md).

[![Support Level](https://img.shields.io/badge/support-maintenance-blue.svg)](#support-level) [![License: GPL 2.0 or later](https://img.shields.io/badge/License-GPL%202.0%20or%20later-yellow.svg)](https://spdx.org/licenses/GPL-2.0-or-later.html)

[![projects builds](https://github.com/10up/10up-toolkit/actions/workflows/build-test-projects.yml/badge.svg)](https://github.com/10up/10up-toolkit/actions/workflows/build-test-projects.yml) [![tests](https://github.com/10up/10up-toolkit/actions/workflows/test.yml/badge.svg)](https://github.com/10up/10up-toolkit/actions/workflows/test.yml) 

## Tools

* [@10up/babel-preset-default](packages/babel-preset-default/README.md)
* [@10up/eslint-config](packages/eslint-config/README.md)
* [@10up/stylelint-config](packages/stylelint-config/README.md)
* [10up-toolkit](packages/toolkit/README.md)

## Documentation

Check out the documentation in [10up-toolkit](packages/toolkit/README.md) README file.

## Support Level

**Maintenance:** 10up only fixes security issues and bugs that block builds. No new features are planned. New work happens in [10up/wp-tooling](https://github.com/10up/wp-tooling).

## Repository Structure and Engineering Guidelines
Visit the [CONTRIBUTING](/CONTRIBUTING.md) page for initial contribution, engineering guidance, and details on how to get set up properly.

This repository is a monorepo, under the `packages` there are all the tools that are published to npm. The `projects` directory is a collection of tests projects linked to the tools in `packages` and is used for testing purposes.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850" alt="10up"></a>
