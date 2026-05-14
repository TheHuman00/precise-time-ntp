# Security Policy

## Supported Versions

Only the latest major version receives security updates.

| Version | Supported |
|---------|-----------|
| 2.x (latest) | ✅ |
| 1.x | ❌ |

**Support duration:** Each major version is supported until the next major version has been stable for 30 days, at which point it reaches end-of-life and no longer receives security updates. Users are encouraged to upgrade promptly.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly — **do not open a public GitHub issue**.

**Options:**
1. Use [GitHub private security advisories](https://github.com/TheHuman00/precise-time-ntp/security/advisories/new)
2. Email: precise-time-ntp.broiling732@aleeas.com

Include: description, steps to reproduce, potential impact, and suggested fix if available.

**Response timeline:**
- Acknowledgment within **48 hours**
- Initial assessment within **5 business days**
- Resolution of critical vulnerabilities within **30 days**

We follow responsible disclosure: once a fix is released, the vulnerability will be publicly disclosed via a GitHub Security Advisory.

## Secrets and Credentials Policy

- All secrets (npm tokens, GitHub tokens) are stored exclusively as GitHub Actions secrets — never in source code or configuration files
- The `NPM_TOKEN` is scoped to publish-only access
- Secrets are rotated immediately upon suspected compromise or maintainer offboarding
- `.env` files and credential files are listed in `.gitignore` and must never be committed

## Dependency Vulnerability Policy (SCA)

- **Critical / High** vulnerabilities in dependencies must be resolved before the next release
- **Medium** vulnerabilities must be assessed within 30 days and resolved or documented as non-exploitable
- `npm audit` runs automatically on every CI run and blocks merges on high/critical findings
- Vulnerabilities assessed as non-exploitable in the context of this library are documented in GitHub Security Advisories with a VEX-style justification

## Static Analysis Policy (SAST)

- CodeQL runs automatically on every push and pull request via GitHub Actions
- Any CodeQL finding of severity **high or critical** must be resolved or suppressed with documented justification before the change is merged
- Medium findings are reviewed within 30 days

## Verifying Releases

**Integrity:** npm stores a SHA-512 hash for every published version. `npm ci` verifies these automatically via `package-lock.json`. To inspect manually:
```bash
npm view precise-time-ntp@2.1.0 dist.integrity
```

**Identity:** All releases are published by `@TheHuman00` via the public GitHub Actions workflow (`publish.yml`). Verify the publisher:
```bash
npm owner ls precise-time-ntp
```

## Attribution

Security researchers who responsibly disclose vulnerabilities will be acknowledged (unless they prefer to remain anonymous).
