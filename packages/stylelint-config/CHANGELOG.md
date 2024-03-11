# Changelog

## 3.0.0

### Major Changes

- ea9ca67: Discourage usage of `@nest` by disallowing the at-rule.
  Adding support for new way of doing nesting as per latest Nesting Spec (as implemented by browsers in 2023).
- 3fce625: Upgrading `stylelint` to version `15.0.0` and decouple from `@wordpress/stylelint-config`.

### Patch Changes

- 5734ef9: Update `custom-property-pattern` regular expression to also match custom properties that use a singular `-` as a group separator
- ae04aa8: fix update custom property pattern to also allow for single `-` separator

## 3.0.0-next.1

### Patch Changes

- 5734ef9: Update `custom-property-pattern` regular expression to also match custom properties that use a singular `-` as a group separator
- ae04aa8: fix update custom property pattern to also allow for single `-` separator

## 3.0.0-next.0

### Major Changes

- ea9ca67: Discourage usage of `@nest` by disallowing the at-rule.
  Adding support for new way of doing nesting as per latest Nesting Spec (as implemented by browsers in 2023).
- 3fce625: Upgrading `stylelint` to version `15.0.0` and decouple from `@wordpress/stylelint-config`.

## 2.0.5

### Patch Changes

- b172081: Fixes validation for `--wp--some--property` for custom properties
  Fixes usage of `currentcolor` vs `currentColor`

## 2.0.5-next.0

### Patch Changes

- b172081: Fixes validation for `--wp--some--property` for custom properties
  Fixes usage of `currentcolor` vs `currentColor`

## 2.0.4

### Patch Changes

- 7ee697b: Ensuring stylelint supports SCSS in a separate ruleset

## 2.0.4-next.0

### Patch Changes

- 7ee697b: Ensuring stylelint supports SCSS in a separate ruleset

## 2.0.3

### Patch Changes

- 12f9cf9: Ensure SCSS config accepts mixin at-rules from postcss-mixins

## 2.0.2

### Patch Changes

- 010cea6: Updating package.json links to point to the new repository

## 2.0.1

All notable changes to this project will be documented in this file, per [the Keep a Changelog standard](http://keepachangelog.com/).

## 2.0.0

- Drops support of Stylelint 13 (breaking)
- Updated `@wordpress/stylelint-config` to `20.0.1` (major)
- Updated `stylelint-order` to `5.0.0` (major)
- Stylelint is now a `peerDependency` (major)

## 1.1.3

- updated dependencies
- Change Stylelint configuration to allow color properties to use any of the global CSS values without a variable.

## 1.1.2

- Add stylelint support for mixins. Props @rdimascio

## 1.1.1

- Fix a bug in the config where it was extending the wrong config.

## 1.1.0

- Updates dependencies
