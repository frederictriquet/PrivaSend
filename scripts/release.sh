#!/bin/bash
# Release script for PrivaSend
# Usage: ./scripts/release.sh [major|minor|patch|version]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get new version type
VERSION_TYPE=$1

if [ -z "$VERSION_TYPE" ]; then
  echo -e "${RED}Error: Version type required${NC}"
  echo "Usage: ./scripts/release.sh [major|minor|patch|1.0.0]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/release.sh patch   # 0.4.0 → 0.4.1"
  echo "  ./scripts/release.sh minor   # 0.4.0 → 0.5.0"
  echo "  ./scripts/release.sh major   # 0.4.0 → 1.0.0"
  echo "  ./scripts/release.sh 1.0.0   # Set specific version"
  exit 1
fi

# Check clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${RED}Error: Working directory not clean${NC}"
  echo "Please commit or stash your changes first"
  git status --short
  exit 1
fi

# Check on master branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "master" ]; then
  echo -e "${YELLOW}Warning: Not on master branch (currently on $CURRENT_BRANCH)${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}Current version: v$CURRENT_VERSION${NC}"

# Update version
echo "Updating version..."
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}New version: v$NEW_VERSION${NC}"

# Commit and tag
git add package.json
git commit -m "chore: Release v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo ""
echo -e "${GREEN}✅ Version updated and tagged${NC}"
echo ""
echo "Next steps:"
echo "1. Review the changes:"
echo "   git show v$NEW_VERSION"
echo ""
echo "2. Push to trigger CI/CD:"
echo "   git push origin master --tags"
echo ""
echo "3. Monitor the build:"
echo "   https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
echo ""
echo "4. Docker image will be available at:"
echo "   ghcr.io/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/' | tr '[:upper:]' '[:lower:]'):v$NEW_VERSION"
echo ""
