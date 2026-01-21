# Publishing Guide for redash-connector-mcp

This guide walks through the process of publishing this package to npm.

## Pre-Publication Checklist

### 1. Update package.json

Replace placeholder values in `package.json`:

```json
{
  "author": "Your Name <your.email@example.com>",  // ← Update this
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/redash-connector-mcp.git"  // ← Update this
  },
  "bugs": {
    "url": "https://github.com/yourusername/redash-connector-mcp/issues"  // ← Update this
  },
  "homepage": "https://github.com/yourusername/redash-connector-mcp#readme"  // ← Update this
}
```

### 2. Create .npmignore

Create a `.npmignore` file to exclude unnecessary files from the npm package:

```
# Source files
src/
tests/
coverage/

# Configuration files
.env
.env.example
.env.*
tsconfig.json
tsconfig.lint.json
vitest.config.ts
eslint.config.js
.prettierrc
.prettierignore

# Git files
.git/
.gitignore
.github/

# Development files
node_modules/
*.log
.DS_Store
.vscode/
.idea/

# Documentation (keep only README.md)
PUBLISHING.md
.claude/

# CI/CD
.husky/
```

### 3. Verify Build

Ensure the project builds successfully:

```bash
npm run build
```

This should create the `dist/` directory with:
- `dist/index.js` (with shebang `#!/usr/bin/env node`)
- All TypeScript compiled files

### 4. Run Tests

Ensure all tests pass:

```bash
npm test
npm run lint
npm run typecheck
```

All checks should pass before publishing.

## Publishing Steps

### Step 1: Create npm Account

If you don't have an npm account:

1. Go to https://www.npmjs.com/signup
2. Create an account
3. Verify your email address

### Step 2: Login to npm

```bash
npm login
```

You'll be prompted for:
- Username
- Password
- Email
- One-time password (if 2FA is enabled)

### Step 3: Check Package Name Availability

```bash
npm search redash-connector-mcp
```

If the name is already taken, update `"name"` in `package.json`.

### Step 4: Dry Run (Optional but Recommended)

Test what will be published without actually publishing:

```bash
npm publish --dry-run
```

This shows:
- Which files will be included
- The package size
- Any warnings or errors

### Step 5: Publish to npm

For the first release:

```bash
npm publish
```

For scoped packages (if you want to use `@yourname/redash-connector-mcp`):

```bash
npm publish --access public
```

### Step 6: Verify Publication

1. Check npm: https://www.npmjs.com/package/redash-connector-mcp
2. Test installation:
   ```bash
   npm install -g redash-connector-mcp
   redash-connector-mcp --version
   ```

## Updating the Package

### Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.0 → 1.0.1): Bug fixes
  ```bash
  npm version patch
  ```

- **Minor** (1.0.0 → 1.1.0): New features (backward compatible)
  ```bash
  npm version minor
  ```

- **Major** (1.0.0 → 2.0.0): Breaking changes
  ```bash
  npm version major
  ```

### Publishing Updates

```bash
# 1. Make your changes
# 2. Run tests
npm test

# 3. Update version
npm version patch  # or minor/major

# 4. Build
npm run build

# 5. Publish
npm publish

# 6. Push git tags
git push --follow-tags
```

## Post-Publication Tasks

### 1. Create GitHub Release

1. Go to your repository's Releases page
2. Click "Create a new release"
3. Tag: `v1.0.0` (matching the npm version)
4. Release title: `v1.0.0 - Initial Release`
5. Description: Copy from CHANGELOG or describe key features
6. Publish release

### 2. Update README Badges

Ensure badges reflect the actual published version:

```markdown
[![npm version](https://badge.fury.io/js/redash-connector-mcp.svg)](https://www.npmjs.com/package/redash-connector-mcp)
```

### 3. Test claude mcp add

Once published, test the installation:

```bash
claude mcp add redash-connector-mcp
```

## Troubleshooting

### Error: "You do not have permission to publish"

**Solution**:
- Verify you're logged in: `npm whoami`
- Check package name isn't already taken
- For scoped packages, use `--access public`

### Error: "Version already exists"

**Solution**: Update the version number in `package.json` or use `npm version`

### Files missing from package

**Solution**:
- Check `.npmignore`
- Use `npm publish --dry-run` to preview
- Ensure `"files": ["dist"]` is in `package.json`

### Package too large

**Solution**:
- Check what's included: `npm publish --dry-run`
- Add more patterns to `.npmignore`
- Remove unnecessary dependencies

## Security Best Practices

1. **Enable 2FA**: Set up two-factor authentication on your npm account
2. **Use npm tokens**: For CI/CD, use automation tokens instead of passwords
3. **Review dependencies**: Run `npm audit` before publishing
4. **Sign releases**: Consider signing Git tags

## Automation (Optional)

### GitHub Actions for Auto-Publishing

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then:
1. Create an npm access token: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add it to GitHub Secrets as `NPM_TOKEN`
3. Create a GitHub release to trigger auto-publish

## Quick Reference Commands

```bash
# Check current version
npm version

# Login to npm
npm login

# Preview what will be published
npm publish --dry-run

# Publish to npm
npm publish

# Update patch version (1.0.0 → 1.0.1)
npm version patch

# Update minor version (1.0.0 → 1.1.0)
npm version minor

# Update major version (1.0.0 → 2.0.0)
npm version major

# View published package info
npm info redash-connector-mcp

# Unpublish (within 72 hours only!)
npm unpublish redash-connector-mcp@1.0.0
```

## License

Remember to include a LICENSE file (already should be MIT as per package.json).
