# Development setup

## Requirements

- Node 24 (`node -v`), npm 11.
- Python 3.12 (`py`) for the Claude Code hooks.
- GitHub CLI logged in as PeterSallai90.

## Everyday commands

See CLAUDE.md, "Commands". The dev server runs on port 5180 and the preview server on 5181, so
they do not clash with other local projects.

## GitHub

- Repository: https://github.com/PeterSallai90/dont-give-up (public). Default branch: develop.
- main and develop are protected by rulesets: pull requests only, linear history, required checks
  `lint`, `test`, `build` and `owner-gate`.
- Project board: "Don't Give Up" (see the number with `gh project list --owner @me`).
- Previews: GitHub Pages from the `gh-pages` branch; develop at the site root, pull requests under
  `pr-preview/pr-<N>/`.

## Owner gate

A pull request with `needs:owner` (added by path rules or by the team for visible changes) waits
until the owner playtests the preview and adds `owner-approved`. Pull requests into main always
need `owner-approved`.

## Claude Code

This project runs with the personal Claude configuration (CLAUDE_CONFIG_DIR =
C:\Users\peter\.claude-personal). Start it with that configuration, never with the default
`~/.claude` one, which belongs to another setup. Agent run statistics: the local hook in
.claude/settings.local.json logs runs to .claude/state/agent-runs.jsonl; report with
`py -I C:/Users/peter/.claude-personal/hooks/agent_stats.py report C:/Dev/dont-give-up`.
