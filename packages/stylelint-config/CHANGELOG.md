# Changelog

## 4.0.0-next.0

### Major Changes

- e40dc56: Support and default to Node 24

  Node 24 (current Active LTS) is now the version the toolkit is developed, tested and released against, and the minimum supported Node version is now 20. Node 16 and 18 are past end-of-life and have been dropped from the test matrix; CI now covers Node 20, 22 and 24.

  This is a breaking change only in the sense that `engines` no longer permits Node 16/18. No build, config or API behaviour has changed — see `UPGRADING.md` for details.

### Minor Changes

- 2535d76: Align stylelint configuration with 10up CSS Engineering Best Practices

  This release adds several new rules to enforce 10up CSS best practices:

  **Specificity Controls:**
  - Add `selector-max-specificity` rule limiting specificity to 0,2,1
  - Add `selector-max-id` rule disallowing ID selectors for styling
  - Add `max-nesting-depth` rule limiting nesting to 2 levels
  - Re-enable `no-descending-specificity` rule

  **Code Quality:**
  - Add `declaration-no-important` rule disallowing !important
  - Add `selector-no-qualifying-type` rule preventing type+class qualifiers
  - Add `shorthand-property-no-redundant-values` rule for efficient CSS

  **Naming Conventions:**
  - Enable `selector-class-pattern` rule enforcing kebab-case for classes, with optional BEM `__element` and `--modifier` suffixes. camelCase and snake_case are rejected; `.card__header--compact` and WordPress core classes such as `.wp-block-group__inner-container` are allowed
  - Add `keyframes-name-pattern` rule enforcing kebab-case for animations

  **Breaking Changes:**
  Projects using this configuration may need to update existing CSS to comply with the new rules. The most impactful changes are:
  - ID selectors are now disallowed for styling
  - Class names must use kebab-case, optionally with BEM `__element`/`--modifier` suffixes (no camelCase or snake_case, and no leading hyphen such as `.-secondary`)
  - Maximum selector specificity is now enforced at 0,2,1
  - Nesting depth is limited to 2 levels

  `!important` is reported as an error, but best practices reserve it for truly exceptional cases such as `prefers-reduced-motion` overrides. Disable it narrowly at the call site with a comment explaining why, rather than turning the rule off project-wide.

  See the updated README for detailed documentation on each rule and how to override them if needed for your project.

## 3.0.1

### Patch Changes

- 04fa289: Fix wrong peer deps in some packages and make sure all packages supports v22

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
