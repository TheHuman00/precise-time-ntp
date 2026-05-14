# Security Assessment

Last reviewed: 2026-05-14 — v2.1.0

## What this library does

Queries NTP servers over UDP, computes a clock offset, and optionally broadcasts timestamps via WebSocket. It handles no credentials, no user data, and no authentication.

## Attack surface

| Vector | Risk | Note |
|--------|------|------|
| NTP response parsing | Low | Fixed 48-byte binary format; malformed packets are skipped |
| NTP spoofing | Low | Multiple servers queried; coherence validation detects outliers |
| WebSocket server | Low | Read-only timestamps only; opt-in feature |
| `ws` dependency | Low | Single runtime dependency; monitored via `npm audit` |
| npm supply chain | Mitigated | MFA enforced; token in GitHub secret; tests run before publish |

## What the library does NOT protect against

- Applications that expose the WebSocket port without access control (the embedding app's responsibility)
- NTP servers being compromised at the network level
- Clock skew attacks if `coherenceValidation` is disabled by the caller

## Threat Modeling — Critical Code Paths

### Critical path 1: NTP offset calculation

`readNtpTimestamp()` parses the 48-byte binary NTP response. A malformed or spoofed response could produce an incorrect offset.

**Mitigations:** Multiple servers queried in parallel; median offset used when coherence validation is enabled; individual server failures are caught and skipped.

### Critical path 2: WebSocket broadcast

`startWebSocketServer()` opens a TCP port. Any connected client receives time broadcasts.

**Mitigations:** Opt-in only; no credentials transmitted; embedding application is responsible for network access control.

### Critical path 3: npm publish pipeline

The publish workflow has write access to npm and the GitHub repo.

**Mitigations:** MFA enforced on maintainer accounts; npm token stored as GitHub secret; `npm test` must pass before publish; workflow only triggers on `workflow_dispatch` by maintainers.

## Conclusion

The library's attack surface is minimal. The main residual risk is misuse by embedding applications (unauthenticated WebSocket exposure). This is documented in the README and architecture docs.
