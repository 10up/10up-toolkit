---
"10up-toolkit": patch
---

Fix block entrypoint tests failing on Windows

The `entry` tests mocked `process.cwd()` with a POSIX path while the module under test derives the blocks directory with `path.resolve`, which is platform-native. On Windows the two never lined up, so the blocks directory prefix was never stripped and every entry name came out as a full absolute path, failing 9 tests on the `windows-latest` CI job.

Fixtures are now anchored to the same `path.resolve` call as the code under test, so they describe a filesystem that is self-consistent on every platform. Windows path handling additionally gets its own suite that swaps `path` for `path.win32`, so the behaviour is covered on Linux and macOS runs too instead of only when CI happens to run on Windows.

Test-only change; no runtime behaviour was modified.
