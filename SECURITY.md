# Security Policy

## Supported Versions

We actively support the following versions of precise-time-ntp with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability in precise-time-ntp, please report it responsibly.

### How to Report

1. **DO NOT** create a public GitHub issue for security vulnerabilities
2. Email us directly at: [precise-time-ntp.broiling732@aleeas.com]
3. Include as much information as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Updates**: We will keep you informed of our progress
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days

### Responsible Disclosure

We follow responsible disclosure practices:

1. We will work with you to understand and resolve the issue
2. We will not take legal action against researchers who:
   - Follow this disclosure process
   - Act in good faith
   - Do not access or modify user data
   - Do not perform actions that could harm our users

### Security Best Practices

When using precise-time-ntp:

- Always use the latest version
- Validate all inputs in your application
- Use secure transport (HTTPS/WSS) for WebSocket connections
- Monitor for unusual NTP traffic patterns
- Implement rate limiting for time synchronization requests

## Attribution

We will acknowledge security researchers who responsibly disclose vulnerabilities (unless they prefer to remain anonymous).
