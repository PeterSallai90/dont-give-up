# Architecture

The living technical description. ADRs in docs/adr record the decisions behind it.

## Layers

```
story/<lang>/*.ink        Story content (narrative-designer). Same structure in every language.
src/story/                Story runner: the only code that talks to inkjs.
src/game/      (planned)  Game flow: scenes, choices, saves; reads tags from the story.
src/minigames/ (planned)  One folder per minigame: logic module + Pixi view.
src/ui/        (planned)  Pixi UI components (buttons, text boxes, menus).
src/i18n/                 UI strings per language (en.json, hu.json) and t().
src/platform/  (planned)  Saves, haptics, store and other platform services (web / Capacitor).
tools/                    Build and check scripts (story compile, story check, i18n check).
tests/                    Vitest tests.
```

## Story and state

- The story is compiled from ink to JSON at build time (`npm run story`, output in
  src/generated/, gitignored).
- All state the story reads lives in ink variables. Saving the game saves the ink state JSON
  plus a small game-side header (version, chapter, language, timestamp).
- The game reacts to ink tags (`# scene: ...`, `# minigame: ...`); every tag is listed in
  docs/narrative/story-bible.md.

## Minigame contract

A minigame receives a typed input (from a tag and variables) and resolves a typed result with at
least a score band (`poor | fair | good`). The game writes the result into ink variables and
continues the story. A minigame can always be finished; it never blocks progress.

## Languages

UI strings: dotted keys (`area.subject.detail`) in src/i18n/<lang>.json; `npm run check:i18n`
requires every key in every language. Story: one ink tree per language with identical structure;
`npm run check:story` enforces it. Language comes from `?lang=`, then the browser, then English.

## Performance budgets

- 60 FPS on a mid-range phone.
- First screen interactive within 3 seconds on 4G.
- Initial download as small as possible; each pull request reports the bundle size change.

## Builds and previews

- CI runs lint, typecheck, i18n, story check, tests and the build on every pull request.
- Every pull request from this repository gets a playable preview at
  https://petersallai90.github.io/dont-give-up/pr-preview/pr-<N>/ ; develop is published at
  https://petersallai90.github.io/dont-give-up/ .
- Vite builds with `base: "./"` so the same build works on Pages, in previews and in Capacitor.
