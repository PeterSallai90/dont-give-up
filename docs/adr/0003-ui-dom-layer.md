# 0003 Menus and dialogs in a DOM layer over the Pixi canvas

- Status: Accepted (pull request for #14)

## Context

#14 brings the first real UI: the start screen with the mode pick, a settings button on every
screen where a game runs (also over a running minigame round), the settings panel and the New game
confirmation. #48 (start-screen language pick) and later menus follow the same pattern.
docs/architecture.md planned "Pixi UI components" in src/ui.

The requirements of #14 that decide the technology:

- an accessible label on the settings button, Escape to close, focus moved into the panel on open
  and back to the opener on close (AC 4);
- Hungarian text that wraps and fits on a 360 px phone without cut-off text (AC 18), body text at
  least 16 px (docs/art-style.md);
- two buttons of equal size and weight in the confirmation, none highlighted (AC 11);
- taps and keys must not reach a running round while the panel is open (AC 5);
- the first screen interactive within 3 seconds on 4G with the smallest initial download
  (docs/architecture.md, performance budgets);
- no new dependency (CLAUDE.md, pinned stack).

Pixi 8 renders text to a canvas. Its accessibility system adds hidden DOM shadow elements for
tab navigation, but focus return, Escape, screen-reader labels, text reflow and font scaling would
all be our own code, and every menu would pay for it again.

## Decision

1. Menus, overlays and dialogs (start screen, settings button and panel, confirmations, later
   language pick and pause-style menus) are plain DOM elements in one overlay layer
   (`#ui-root`) above the Pixi canvas. They are written with the standard DOM API in
   TypeScript; no UI framework and no new dependency.
2. Pixi keeps the scenes, characters and minigames. Whether the story text and choices (#47) are
   DOM or Pixi is decided in the #47 technical plan; this ADR does not decide it.
3. Logic and view are split as everywhere else: the state of a menu (open, confirm, current mode,
   whether New game is shown) and every action live in Node-testable modules in src/game; the
   views in src/ui only build elements, read that state and forward clicks and keys. Views are not
   unit-tested (Vitest runs in Node without a DOM, and no jsdom dependency is added); they are
   checked on the preview.
4. A modal panel uses the native `<dialog>` element with `showModal()`: the rest of the page
   is inert, so pointer input cannot reach the canvas. Key events are stopped at the dialog so a
   round that listens on `window` does not see them. The game is told through
   `onPanelOpen` / `onPanelClose` callbacks (the round pause itself is #21).
5. Styling is CSS in src/ui: layout and functional rules (touch targets of at least 44 x 44 px,
   equal buttons, wrapping, scroll on short screens) by the developer; colours, outlines and type
   only from docs/art-style.md (palette as CSS custom properties) by the technical-artist. Icons are
   SVG files under src/assets/ with a row in docs/asset-licenses.md.
6. Pixi is loaded with a dynamic `import("pixi.js")` after the first screen is shown, so the
   start screen does not wait for the renderer download. Story JSON is loaded per language with a
   dynamic import when a game starts or resumes.

## Alternatives considered

- Pixi UI with the Pixi accessibility system: one rendering technology, but focus handling,
  Escape, label semantics, text reflow for Hungarian and font scaling are hand-written per menu,
  and the first screen waits for Pixi. Rejected for menus.
- @pixi/ui or a DOM UI framework (Preact, Lit): a new dependency and download size for a handful
  of screens. Rejected; can be revisited by its own issue if menus grow large.
- Native platform dialogs (`confirm()`): cannot be styled or translated reliably and block the
  page. Rejected.

## Consequences

- docs/architecture.md: src/ui holds DOM views; src/game holds their logic.
- The page has two layers: the Pixi canvas (bottom) and `#ui-root` (top). Elements in
  `#ui-root` that are not open take no pointer events, so the canvas stays playable around the
  settings button.
- Capacitor uses the same DOM layer in its web view; a native back button is a later issue.
- Initial download: the renderer moves out of the first chunk (today the first chunk is 87 kB
  gzip, almost all Pixi); inkjs (about 31 kB gzip) and the menu code stay in it. Each pull request
  still reports the size change.
- Visual changes to menus are CSS and SVG changes, reviewed on the preview against
  docs/art-style.md.
