---
"10up-toolkit": patch
---

Security: land the `sharp` bump and reconcile the dependabot manifest with its lockfile

Bumps `sharp` from `0.32.6` to `0.35.3`, resolving the inherited libvips advisories that
the previous security sweep had to defer, plus `webpack-dev-server` to `^5.2.6` and the
patched transitives `@babel/core@^7.29.6`, `qs@6.15.3`, `brace-expansion@2.1.4`,
`esbuild@0.28.2`, `form-data@4.0.6`, `immutable@5.1.9`, `tmp@0.2.7`, `ws@7.5.13`,
`websocket-driver@0.7.5` and `body-parser@1.20.6`. `npm audit` goes from 2 critical to 0.

**AVIF minification fix.** sharp reports `.avif` input as format `heif`, and from 0.35 the
heif encoder requires an explicit compression. `config.heif` in `optimization.js` is now
`{ ...config.avif, compression: 'av1' }`; without it, `heif()` throws
`Expected one of: av1, hevc for compression but received undefined` and every `.avif`
asset fails minification. Projects that run `.avif` files through the build are the ones
affected — no config change is needed on their side.

**Why the earlier `sharp` backout no longer applies.** That revert was correct at the time:
from 0.33 onward sharp ships its prebuilt binaries as per-platform optional dependencies
(`@img/sharp-linux-x64`, `@img/sharp-win32-x64`, …), and the lockfile generated then
recorded only the host (darwin-arm64) entries, breaking `npm ci` on Linux and Windows with
_"Could not load the `sharp` module using the linux-x64 runtime"_. npm now records every
platform's entries regardless of the resolving host — this lockfile carries all 26
`@img/sharp-*` entries (darwin, linux, linuxmusl, win32, freebsd, wasm), and a from-scratch
re-resolve on macOS reproduces all 26 rather than pruning to darwin. Verified in a real
`linux/amd64` container that `npm ci` succeeds and `require('sharp')` loads the linux-x64
binary and encodes AVIF on both Node 20 (npm 10.8.2) and Node 24 (npm 11.17).

Worth a glance after any future lockfile regeneration: the `@img/sharp-*` entry count
should stay at 26.
