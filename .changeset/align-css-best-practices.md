---
"@10up/stylelint-config": minor
---

Align stylelint configuration with 10up CSS Engineering Best Practices

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
