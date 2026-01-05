# GitHub Workflows & Automation

This directory contains GitHub Actions workflows and automation configurations for MARIE.

## 📋 Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Triggers:** Push to `main`, `develop`, or `feature/**` branches; Pull requests

**Jobs:**
- **Backend Tests**: Linting (ruff), type checking (mypy), unit tests (pytest)
- **Frontend Tests**: ESLint, TypeScript checking, Prettier, build verification
- **E2E Tests**: Playwright tests with full Docker Compose stack
- **Docker Build**: Build and push Docker images to registry (main/develop only)
- **Security Scan**: Trivy vulnerability scanning
- **Release**: Create GitHub releases with tagged versions (main only)

**Services:**
- OpenSearch 2.11 for backend tests

**Artifacts:**
- Playwright test reports
- Code coverage reports (uploaded to Codecov)
- Trivy security scan results (uploaded to GitHub Security)

### 2. Version Bump (`version-bump.yml`)

**Trigger:** Manual workflow dispatch

**Inputs:**
- `bump_type`: Choose between `patch`, `minor`, or `major`

**Actions:**
1. Reads current version from `VERSION` file
2. Bumps version according to semantic versioning
3. Updates `VERSION`, `package.json`, `CHANGELOG.md`
4. Creates git commit and tag
5. Pushes changes and triggers CI/CD pipeline

**Usage:**
```bash
# Via GitHub UI: Actions → Version Bump → Run workflow → Select bump type

# Or via GitHub CLI
gh workflow run version-bump.yml -f bump_type=patch
gh workflow run version-bump.yml -f bump_type=minor
gh workflow run version-bump.yml -f bump_type=major
```

### 3. Dependabot (`dependabot.yml`)

**Schedule:** Weekly (Mondays)

**Monitors:**
- Frontend npm dependencies (`/frontend`)
- Backend pip dependencies (`/backend`)
- GitHub Actions versions
- Docker base images

**Configuration:**
- Max 5 PRs for npm/pip, 3 PRs for Docker
- Auto-labels by ecosystem
- Prefixes commit messages by component
- Ignores major version updates for core dependencies

## 🚀 Release Process

### Automated Release Flow

1. **Developer merges feature to `main`**
   ```bash
   git checkout main
   git merge feature/my-feature
   git push origin main
   ```

2. **Run Version Bump workflow**
   - Go to GitHub Actions
   - Select "Version Bump"
   - Click "Run workflow"
   - Choose bump type (patch/minor/major)

3. **Automatic steps:**
   - Version bumped in `VERSION` and `package.json`
   - `CHANGELOG.md` updated with template
   - Git tag created (e.g., `v1.2.3`)
   - Changes committed and pushed
   - CI/CD pipeline triggered

4. **CI/CD builds and releases:**
   - Runs all tests
   - Builds Docker images
   - Pushes to Docker registry
   - Creates GitHub release

5. **Result:**
   - New version tag on GitHub
   - Docker images available:
     ```bash
     docker pull <username>/marie-backend:1.2.3
     docker pull <username>/marie-frontend:1.2.3
     ```
   - GitHub release with changelog

### Manual Release (if needed)

```bash
# 1. Update version manually
echo "1.2.3" > VERSION

# 2. Update package.json
cd frontend && npm version 1.2.3 --no-git-tag-version

# 3. Update CHANGELOG.md
# Add entry manually

# 4. Commit and tag
git add VERSION frontend/package.json CHANGELOG.md
git commit -m "chore: bump version to 1.2.3"
git tag -a v1.2.3 -m "Release v1.2.3"

# 5. Push
git push origin main --tags
```

## 📊 Status Badges

Add to README.md:

```markdown
![CI/CD Pipeline](https://github.com/omazapa/marie_chat/workflows/CI%2FCD%20Pipeline/badge.svg)
![Version](https://img.shields.io/github/v/release/omazapa/marie_chat)
![License](https://img.shields.io/github/license/omazapa/marie_chat)
```

## 🔐 Required Secrets

Configure in GitHub repository settings → Secrets and variables → Actions:

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password or access token
- `CODECOV_TOKEN`: Codecov upload token (optional)
- `GITHUB_TOKEN`: Auto-provided by GitHub Actions

## 🛠️ Local Testing

### Test workflows locally with `act`

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# List available workflows
act -l

# Run specific job
act -j backend-tests

# Run with secrets
act -j docker-build --secret-file .secrets
```

### Validate workflow syntax

```bash
# Install actionlint
brew install actionlint

# Check workflows
actionlint .github/workflows/*.yml
```

## 📝 Notes

- **Pre-commit hooks** run before commits to ensure code quality
- **Branch protection** recommended for `main` branch:
  - Require PR reviews
  - Require status checks to pass
  - Require branches to be up to date
- **Dependabot** PRs should be reviewed and tested before merging
- **Security scans** results viewable in GitHub Security tab

## 🔄 Workflow Updates

When modifying workflows:

1. Test locally with `act` if possible
2. Create feature branch
3. Push and verify workflow runs
4. Merge to main after validation

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
