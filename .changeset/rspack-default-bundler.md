---
"10up-toolkit": major
---

RSPack is now the default bundler, providing ~20% faster builds for WordPress projects.

**Key Benefits:**
- ~17-23% faster builds depending on project type
- Faster HMR (Hot Module Replacement) during development
- Lower memory usage compared to webpack
- Full backwards compatibility - existing projects work without changes

**Webpack Fallback:** If you need to use webpack, you have two options:

```bash
# Environment variable
BUNDLER=webpack npx 10up-toolkit build
```

Or in package.json:
```json
{
  "10up-toolkit": {
    "bundler": "webpack"
  }
}
```

See the [RSPack Migration Guide](./docs/rspack-migration.md) for full details.
