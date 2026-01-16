# Git Configuration and Best Practices

## 🎯 Git Workflow Strategy

### Branch Strategy
```
main (production)
├── develop (staging)
├── feature/user-authentication
├── feature/notifications-system
├── feature/media-upload
├── hotfix/critical-bug-fix
└── release/v1.0.0
```

### Branch Naming Conventions
- **feature/**: New features (`feature/user-profile`)
- **bugfix/**: Bug fixes (`bugfix/login-validation`)
- **hotfix/**: Critical fixes (`hotfix/security-patch`)
- **release/**: Release preparation (`release/v1.0.0`)
- **docs/**: Documentation updates (`docs/api-endpoints`)

## 📋 Commit Message Standards

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **style**: Code formatting
- **refactor**: Code refactoring
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples
```
feat(auth): add JWT token refresh mechanism

- Implement automatic token refresh
- Add refresh token endpoint
- Update authentication middleware

Closes #123

fix(upload): handle large file uploads correctly

- Increase file size limit to 10MB
- Add progress indicator
- Fix memory leak in upload handler

docs(api): update authentication endpoints documentation

- Add new refresh token endpoint
- Update error response examples
- Fix typos in API descriptions
```

## 🔄 Development Workflow

### 1. Create Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/new-feature-name
```

### 2. Development Process
```bash
# Make changes
git add .
git commit -m "feat(component): add new feature"

# Push to remote
git push origin feature/new-feature-name

# Create Pull Request
```

### 3. Pull Request Process
- **Title**: Clear description of changes
- **Description**: Detailed explanation and testing steps
- **Assignees**: Relevant team members
- **Labels**: Type of change, priority
- **Reviewers**: Code review assignment

### 4. Merge Process
```bash
# After PR approval and merge
git checkout develop
git pull origin develop
git checkout main
git pull origin main
git merge develop
git push origin main
```

## 🏗️ Project Structure for Git

### .gitignore Configuration
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
*.tgz

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/
*.lcov

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Docker
.dockerignore

# Uploads
backend/src/uploads/*
!backend/src/uploads/.gitkeep

# Temporary files
tmp/
temp/

# Database
*.sqlite
*.db

# SSL certificates
*.pem
*.key
*.crt

# Backup files
*.backup
*.bak
```

### Repository Structure
```
social-network/
├── .github/
│   ├── workflows/
│   │   └── ci-cd.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── backend/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── docs/
│   ├── api/
│   ├── deployment/
│   └── development/
├── scripts/
│   ├── setup.sh
│   ├── deploy.sh
│   └── backup.sh
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🎯 GitHub Configuration

### Repository Settings
- **Branch protection**: Main branch requires PR review
- **Required status checks**: Tests must pass
- **Auto-delete head branches**: Clean up after merge
- **Merge method**: Squash and merge for clean history
- **Issues**: Enable issue tracking
- **Projects**: GitHub Projects for task management

### Teams and Permissions
- **Owners**: Full repository access
- **Maintainers**: Code review and merge permissions
- **Developers**: Push to feature branches
- **Viewers**: Read-only access

## 📊 Project Management Integration

### GitHub Projects Setup
```
Board Columns:
├── 📋 Backlog
├── 🔄 In Progress
├── 👀 In Review
├── ✅ Testing
└── 🚀 Deployed
```

### Issue Templates
```markdown
<!-- Bug Report Template -->
## Bug Description
[Description of the bug]

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. v1.0.0]
```

### Pull Request Template
```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 🔧 Git Hooks Setup

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run linting
npm run lint

# Run tests
npm test

# Check for sensitive data
if git diff --cached --name-only | xargs grep -l "password\|secret\|key"; then
  echo "Error: Potential sensitive data detected!"
  exit 1
fi
```

### Pre-push Hook
```bash
#!/bin/sh
# .git/hooks/pre-push

# Run full test suite
npm run test:coverage

# Check build
npm run build

echo "All checks passed. Ready to push!"
```

## 📈 Git Best Practices

### Commit Frequency
- **Small commits**: Frequent, focused changes
- **Atomic commits**: One logical change per commit
- **Descriptive messages**: Clear commit history

### Branch Management
- **Short-lived branches**: Delete after merge
- **Regular updates**: Keep branches up-to-date
- **Clear naming**: Understandable branch names

### Code Review
- **Peer review**: Always get second opinion
- **Automated checks**: CI/CD validation
- **Documentation**: Update docs with changes

## 🚨 Troubleshooting

### Common Git Issues
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Fix commit message
git commit --amend

# Resolve merge conflicts
git merge --abort
git reset --hard HEAD

# Clean up local branches
git branch -d feature-name
git remote prune origin
```

### Recovery Procedures
```bash
# Find lost commits
git reflog

# Restore lost commit
git checkout <commit-hash>

# Reset to clean state
git clean -fd
git reset --hard HEAD
```

## 📞 Team Collaboration

### Communication Guidelines
- **Clear PR descriptions**: Explain changes thoroughly
- **Constructive feedback**: Helpful code reviews
- **Regular updates**: Keep team informed
- **Documentation**: Maintain up-to-date docs

### Onboarding New Developers
```bash
# Clone repository
git clone https://github.com/org/repo.git
cd repo

# Setup development environment
npm install
cp .env.example .env

# Create feature branch
git checkout -b feature/first-feature

# Make changes and commit
git add .
git commit -m "feat: add initial feature"
git push origin feature/first-feature
```
