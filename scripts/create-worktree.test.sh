#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TEST_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/academy-worktree-test.XXXXXX")
trap 'rm -rf "$TEST_ROOT"' EXIT

REPO="$TEST_ROOT/repo"
mkdir -p "$REPO/backend" "$REPO/frontend"
REPO=$(cd "$REPO" && pwd)
git -C "$REPO" init -q -b main
git -C "$REPO" config user.name "Worktree Test"
git -C "$REPO" config user.email "worktree-test@example.com"
printf '.worktrees/\nbackend/.env\nfrontend/.env\n' > "$REPO/.gitignore"
printf 'DATABASE_URL=test-value\n' > "$REPO/backend/.env"
printf 'NEXT_PUBLIC_API_BASE_URL=http://localhost:3000\n' > "$REPO/frontend/.env"
touch "$REPO/backend/package-lock.json" "$REPO/frontend/package-lock.json"
git -C "$REPO" add .gitignore backend/package-lock.json frontend/package-lock.json
git -C "$REPO" commit -qm "test fixture"

WORKTREE_SETUP_ROOT="$REPO" WORKTREE_SETUP_SKIP_INSTALL=1 "$SOURCE_ROOT/scripts/create-worktree.sh" demo

WORKTREE="$REPO/.worktrees/demo"
test "$(git -C "$WORKTREE" branch --show-current)" = "codex/demo"
test -L "$WORKTREE/backend/.env"
test -L "$WORKTREE/frontend/.env"
test "$(readlink "$WORKTREE/backend/.env")" = "$REPO/backend/.env"
test "$(readlink "$WORKTREE/frontend/.env")" = "$REPO/frontend/.env"
test "$(cat "$WORKTREE/backend/.env")" = 'DATABASE_URL=test-value'
test "$(cat "$WORKTREE/frontend/.env")" = 'NEXT_PUBLIC_API_BASE_URL=http://localhost:3000'

echo 'create-worktree integration test: PASS'
