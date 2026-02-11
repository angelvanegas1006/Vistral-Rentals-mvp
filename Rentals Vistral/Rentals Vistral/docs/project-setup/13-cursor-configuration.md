# 13. Cursor Configuration

## Models

- **Complex tasks:** Claude 4 Sonnet / GPT-5.1 Codex
- **Simple edits:** GPT-4.1 Codex

## Mode

- **Default:** Agent/Composer mode (for code tasks)
- **Non-code tasks:** Chat mode

## Context Management

- **Max files:** 50 files via @mentions
- **Indexing:** Use `.cursorignore` to exclude unnecessary files
- **Priority indexing:** `components/`, `lib/`, `app/`
- **Excluded:** `node_modules/`, `.next/`, `.env*`, `*.log`, `*.pem`, `*.key`

## Workflow

1. **Create PRD.md or SPEC.md** for features before coding
2. **Use Notepads** for common prompts (code review, security checks)
3. **Commit before major AI refactors** (use Restore feature if needed)
4. **Use Debug Mode** for runtime issues

## Security in Cursor

- **Never paste real secrets** — Always use placeholders
- **Never read `.env*` files** — Use `.env.local.example` for structure
- **Service role key** — Only in `app/api/**` or `lib/supabase/server.ts`
- **`.cursorignore`** — Excludes sensitive files from indexing
