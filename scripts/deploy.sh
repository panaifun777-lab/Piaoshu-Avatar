#!/usr/bin/env bash
# deploy.sh — Push to GitHub and trigger Vercel deployment
# Usage: ./scripts/deploy.sh [--prod] [--message "deploy message"]

set -euo pipefail

PROD=false
COMMIT_MSG=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --prod)
      PROD=true
      shift
      ;;
    --message)
      COMMIT_MSG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: ./scripts/deploy.sh [--prod] [--message \"deploy message\"]"
      exit 1
      ;;
  esac
done

# Navigate to project root (two levels up from scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 飘叔 Avatar OS — Deploy Script"
echo "=================================="
echo ""

# Check if we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  Warning: You are on branch '$BRANCH', not 'main'."
  echo "    Vercel production deployments are typically triggered from 'main'."
  echo ""
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
  echo "📝 Uncommitted changes detected."
  if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="deploy: $(date '+%Y-%m-%d %H:%M:%S')"
  fi
  git add -A
  git commit -m "$COMMIT_MSG"
  echo "✓ Committed: $COMMIT_MSG"
else
  echo "✓ Working directory clean"
fi

# Pull latest changes
echo ""
echo "⬇️  Pulling latest from remote..."
git pull origin "$BRANCH" --rebase || {
  echo "❌ Failed to pull. Please resolve conflicts manually."
  exit 1
}

# Push
echo ""
echo "⬆️  Pushing to GitHub..."
git push origin "$BRANCH"

echo ""
echo "✅ Code pushed successfully!"

# Vercel deploy trigger
echo ""
echo "🔗 Vercel will auto-deploy on push to main."
echo "   Check status at: https://vercel.com/dashboard"

if [ "$PROD" = true ]; then
  echo ""
  echo "🏭 Production deployment requested."
  echo "   If you have Vercel CLI installed, you can run:"
  echo "   vercel --prod"
fi

echo ""
echo "🎉 Deploy complete!"
echo "   Production URL: https://piaoshu-avatar.vercel.app"
