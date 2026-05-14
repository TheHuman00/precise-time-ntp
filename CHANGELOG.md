# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-05-14

### Added
- ESLint (`eslint:recommended`) configured via `eslint.config.js` — `npm run lint`
- CI workflow (`ci.yml`): runs lint, tests, `npm audit`, and CodeQL on every push and PR
- `CHANGELOG.md` — release notes following Keep a Changelog format
- `GOVERNANCE.md` — project members, roles, and permissions policy
- `docs/architecture.md` — actors, data flows, and trust boundaries
- `docs/security-assessment.md` — attack surface analysis and threat modeling

### Changed
- `SECURITY.md` overhauled: supported versions updated to 2.x, added secrets policy, SCA/SAST remediation thresholds, and release verification instructions
- `CONTRIBUTING.md`: added dependency management policy and contributor license clause
- `publish.yml`: inputs sanitized and validated before use; permissions scoped to job level
- `index.js` / `test.js`: fixed 3 ESLint errors (unused catch variables, empty block)

## [2.1.0] - 2026-04-28

### Fixed
- RTT (round-trip time) compensation now correctly accounts for asymmetric network latency
- Locale support improved for `format()` method — system locale is properly detected and applied
- Error messages are now consistent across all failure paths

### Changed
- Documentation fully updated and restructured across all `docs/` files

## [2.0.1] - 2025-07-06

### Added
- Smooth correction system: large clock offsets are now applied gradually to avoid time jumps (`setSmoothCorrection`, `forceCorrection`)
- Enhanced precision: multiple NTP servers are queried and the median offset is used
- Coherence validation: servers that disagree by more than 100ms trigger a `coherenceWarning` event
- New events: `driftWarning`, `correctionComplete`
- New utility methods: `format()`, `diff()`, `log()`, `stats()`
- WebSocket server support for pushing NTP time to browser clients (`startWebSocketServer`)

### Changed
- Major internal refactor for improved accuracy and reliability

## [1.0.6] - 2025-07-02

### Changed
- Test output messages refactored to English

## [1.0.5] - 2025-07-01

### Added
- `CODE_OF_CONDUCT.md` added to the repository
- GitHub issue templates (bug report, feature request)
- Pull request template

### Changed
- Security contact email updated in `SECURITY.md`

## [1.0.4] - 2025-06-30

### Changed
- Removed `chalk` dependency — the library now has zero runtime dependencies for this functionality
- Internal code comments cleaned up

## [1.0.3] - 2025-06-29

### Added
- Package is now also published to GitHub Packages (`@thehuman00/precise-time-ntp`)

## [1.0.2] - 2025-06-28

### Fixed
- README general information corrected

## [1.0.1] - 2025-06-27

### Added
- Initial release
- NTP time synchronization via UDP
- `sync()`, `now()`, `timestamp()`, `isSynchronized()` API
- `startAutoSync()` / `stopAutoSync()` for automatic drift prevention
- GitHub Actions workflow for publishing to npm

[2.1.1]: https://github.com/TheHuman00/precise-time-ntp/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/TheHuman00/precise-time-ntp/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/TheHuman00/precise-time-ntp/compare/v1.0.6...v2.0.1
[1.0.6]: https://github.com/TheHuman00/precise-time-ntp/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/TheHuman00/precise-time-ntp/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/TheHuman00/precise-time-ntp/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/TheHuman00/precise-time-ntp/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/TheHuman00/precise-time-ntp/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/TheHuman00/precise-time-ntp/releases/tag/v1.0.1
