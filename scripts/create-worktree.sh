#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "사용법: ./scripts/create-worktree.sh <작업명>" >&2
  exit 2
}

NAME=${1:-}
[[ -n "$NAME" ]] || usage
[[ "$NAME" =~ ^[a-z0-9][a-z0-9._-]*$ ]] || {
  echo "작업명은 영문 소문자·숫자로 시작하고 영문 소문자, 숫자, 점, 밑줄, 하이픈만 사용할 수 있습니다." >&2
  exit 2
}

SCRIPT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
if [[ -n "${WORKTREE_SETUP_ROOT:-}" ]]; then
  ROOT=$(cd "$WORKTREE_SETUP_ROOT" && pwd)
else
  COMMON_DIR=$(git -C "$SCRIPT_ROOT" rev-parse --path-format=absolute --git-common-dir)
  ROOT=$(cd "$(dirname "$COMMON_DIR")" && pwd)
fi

BRANCH="codex/$NAME"
WORKTREE="$ROOT/.worktrees/$NAME"

git -C "$ROOT" check-ignore -q .worktrees/.worktree-check || {
  echo "$ROOT/.worktrees가 .gitignore에 등록되어 있지 않습니다." >&2
  exit 1
}

for env_file in backend/.env frontend/.env; do
  [[ -f "$ROOT/$env_file" ]] || {
    echo "필수 환경 파일이 없습니다: $ROOT/$env_file" >&2
    exit 1
  }
done

if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "이미 존재하는 브랜치입니다: $BRANCH" >&2
  exit 1
fi
[[ ! -e "$WORKTREE" ]] || {
  echo "이미 존재하는 경로입니다: $WORKTREE" >&2
  exit 1
}

git -C "$ROOT" worktree add "$WORKTREE" -b "$BRANCH"
ln -s "$ROOT/backend/.env" "$WORKTREE/backend/.env"
ln -s "$ROOT/frontend/.env" "$WORKTREE/frontend/.env"

if [[ "${WORKTREE_SETUP_SKIP_INSTALL:-0}" != "1" ]]; then
  npm ci --prefix "$WORKTREE/backend"
  npm ci --prefix "$WORKTREE/frontend"
  npm --prefix "$WORKTREE/backend" run prisma:generate
fi

echo
echo "워크트리 준비 완료"
echo "브랜치: $BRANCH"
echo "경로: $WORKTREE"
echo "이동: cd $WORKTREE"
