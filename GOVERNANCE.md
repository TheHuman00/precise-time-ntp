# Governance

## Project Members and Access

### Maintainers

| Member | GitHub | Role | Access |
|--------|--------|------|--------|
| TheHuman00 | [@TheHuman00](https://github.com/TheHuman00) | Owner / Lead Maintainer | GitHub repository admin, npm publish rights |

### Sensitive Resources

| Resource | Who has access |
|----------|---------------|
| GitHub repository (admin) | @TheHuman00 |
| npm package (`precise-time-ntp`) | @TheHuman00 |
| GitHub Packages (`@thehuman00/precise-time-ntp`) | @TheHuman00 |
| Repository secrets (NPM_TOKEN, GITHUB_TOKEN) | @TheHuman00 |

## Roles and Responsibilities

### Owner / Lead Maintainer

- Maintains the codebase and reviews all pull requests
- Triages and responds to bug reports and feature requests
- Publishes official releases to npm and GitHub Packages
- Manages repository settings, branch protection rules, and access control
- Responds to security vulnerability reports (see [SECURITY.md](SECURITY.md))
- Keeps dependencies up to date and monitors for vulnerabilities

### Contributors

Contributors are community members who submit pull requests or issues. They do not have write access to the repository by default. Contributions are accepted via pull requests and reviewed by the maintainer before merging.

## Decision Making

As a single-maintainer project, decisions are made by the Lead Maintainer.

## Granting Elevated Permissions

Before any collaborator is granted write or admin access to the repository or npm package:

- The collaborator must have a history of quality contributions (code, docs, or issues)
- The Lead Maintainer reviews their GitHub profile and contribution history
- Access is granted at the minimum level required (e.g. Triage before Write)

This review applies to both repository collaborators and npm publish rights.

## Becoming a Maintainer

If you are an active contributor and are interested in taking on a maintainer role, open an issue to start the conversation.
