# 10up Toolkit

> A collection of tools for building projects at 10up.

[![Support Level](https://img.shields.io/badge/support-active-green.svg)](#support-level) [![License: GPL 2.0 or later](https://img.shields.io/badge/License-GPL%202.0%20or%20later-yellow.svg)](https://spdx.org/licenses/GPL-2.0-or-later.html)

[![projects builds](https://github.com/10up/10up-toolkit/actions/workflows/build-test-projects.yml/badge.svg)](https://github.com/10up/10up-toolkit/actions/workflows/build-test-projects.yml) [![tests](https://github.com/10up/10up-toolkit/actions/workflows/test.yml/badge.svg)](https://github.com/10up/10up-toolkit/actions/workflows/test.yml) 

## Tools

* [@10up/babel-preset-default](packages/babel-preset-default/README.md)
* [@10up/eslint-config](packages/eslint-config/README.md)
* [@10up/stylelint-config](packages/stylelint-config/README.md)
* [10up-toolkit](packages/toolkit/README.md)

## Documentation

Check out the documentation in [10up-toolkit](packages/toolkit/README.md) README file.

## Support Level

**Active:** 10up is actively working on this, and we expect to continue work for the foreseeable future including keeping tested up to the most recent version of WordPress.  Bug reports, feature requests, questions, and pull requests are welcome.

## Repository Structure and Engineering Guidelines
Visit the [CONTRIBUTING](/CONTRIBUTING.md) page for initial contribution, engineering guidance, and details on how to get set up properly.

This repository is a monorepo, under the `packages` there are all the tools that are published to npm. The `projects` directory is a collection of tests projects linked to the tools in `packages` and is used for testing purposes.

## Like what you see?

<a href="http://10up.com/contact/"><img src="https://10up.com/uploads/2016/10/10up-Github-Banner.png" width="850" alt="10up"></a>
