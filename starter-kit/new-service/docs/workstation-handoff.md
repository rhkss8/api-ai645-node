# Workstation Handoff

## Purpose

Use this guide when working from multiple PCs, such as a work computer and a home computer.

The goal is to let Codex continue the same MVP work without losing context.

## Source Of Truth

Use Git as the source of truth.

The following must be committed and pushed:

- Code.
- `docs/` harness updates.
- `docs/decision-log.md`.
- `docs/lessons-and-rules.md`.
- `docs/mvp-todo.md` checkbox changes.

The following must not be committed:

- API keys.
- `.env` files with secrets.
- Local build artifacts.
- Machine-specific IDE settings unless intentionally shared.

## Before Leaving A PC

Run:

```bash
tars handoff
```

Then:

1. Run relevant checks.
2. Update decision and lesson docs.
3. Run `tars done`.
4. Commit the work.
5. Push the branch.

Recommended:

```bash
git status
git add docs src packages apps
git commit -m "fix: 변경 내용 한글 요약"
git push
```

Adjust paths to match the project.

## Starting On Another PC

1. Clone the repo if needed.
2. Install TARS if this PC does not have it.
3. Pull the latest branch.
4. Run TARS checks.
5. Resume with Codex.

Commands:

```bash
git pull
tars doctor
tars status
tars next
```

Then tell Codex:

```txt
tars 기준으로 다음 todo 진행해줘.
```

## Environment Variables

Keep a local `.env.example` committed, but keep real `.env` files untracked.

Each PC should create its own `.env` from `.env.example`.

Example:

```bash
cp .env.example .env
```

## If Work Was Not Committed

Do not start new work on another PC until the previous PC has pushed or explicitly handed off the diff.

If emergency handoff is needed:

1. Create a patch.
2. Send or store it securely.
3. Apply it on the next PC.

Example:

```bash
git diff > handoff.patch
git apply handoff.patch
```

Prefer commits over patches.
