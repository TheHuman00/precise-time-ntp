# Contributing to precise-time-ntp

Thank you for your interest in contributing to precise-time-ntp! We welcome contributions from the community and are grateful for your support.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** and description
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Environment details** (Node.js version, OS, etc.)
- **Code samples** if applicable

### Suggesting Features

We welcome feature suggestions! Please:

- Check if the feature has already been suggested
- Provide a clear description of the feature
- Explain why it would be useful
- Consider providing a simple implementation outline

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow coding standards** (see below)
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Ensure tests pass** by running `npm test`
6. **Create a pull request** with a clear title and description

### License

By submitting a pull request, you certify that you have the right to submit the contribution and that it may be distributed under the terms of the [MIT License](LICENSE) (inbound = outbound).

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/precise-time-ntp.git
cd precise-time-ntp

# Install dependencies
npm install

# Run tests
npm test

# Run examples
npm run basic
npm run auto-sync
npm run websocket
```

## Coding Standards

### JavaScript Style Guide

- Use **camelCase** for variables and functions
- Use **PascalCase** for classes
- Use **UPPER_SNAKE_CASE** for constants
- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Add **JSDoc comments** for public APIs

### Testing

- Write tests for all new features
- Maintain or improve test coverage
- Use descriptive test names

## Project Structure

```
precise-time-ntp/
├── index.js              # Main library file
├── test.js               # Test suite
├── package.json          # Package configuration
├── README.md             # Project documentation
├── LICENSE               # MIT license
├── docs/                 # Documentation files
│   ├── api-reference.md  # API documentation
│   ├── quick-start.md    # Getting started guide
│   └── ...
└── examples/             # Usage examples
    ├── basic.js          # Basic usage
    ├── auto-sync.js      # Auto-sync example
    └── ...
```

## Documentation

When adding new features:

1. Update the main `README.md`
2. Add/update API documentation in `docs/api-reference.md`
3. Create examples in the `examples/` directory
4. Update JSDoc comments in the code

## Dependency Management

This project follows a minimal-dependency philosophy.

**Policy:**
- New runtime dependencies require explicit justification in the PR (security impact, maintenance status, license compatibility)
- Dependencies are pinned via `package-lock.json` and must be committed with every change
- Use `npm ci` (not `npm install`) in CI/CD to guarantee reproducible installs
- Dependencies are tracked via `npm audit` — any new high/critical vulnerability must be resolved before merging

**Adding a dependency:**
1. Verify the license is MIT-compatible
2. Check the package's security history on [npm](https://www.npmjs.com) and [Snyk](https://snyk.io)
3. Justify the addition in your PR description
4. Run `npm audit` and confirm no new vulnerabilities are introduced
