# 0001 Tech stack

- Status: Accepted (owner decision D5, 2026-11-24)

## Context

Story-first 2D game for web and mobile, built by an AI agent team for an owner who does not code.
Web is the hardest target: players leave if loading is slow. We need good 2D performance, small
downloads, one codebase, and tooling agents work with well.

## Decision

- **TypeScript (strict)**, **Vite** for dev server and builds, **Vitest** for tests.
- **PixiJS 8** for rendering (WebGL/WebGPU 2D).
- **Ink** (inkle) for the story, run with **inkjs**; story files per language in story/<lang>/.
- **Spine or Rive** for skeletal animation, decided by its own ADR when the first animated
  character is planned.
- **Capacitor** to package the same web build for iOS and Android, decided in detail by its own
  issue when mobile work starts.

## Alternatives considered

- Godot 4: strong editor, but heavier web export and no C# on web.
- Defold: tiny builds, but Lua and a smaller community.
- Unity: heavy web builds, 3D-first strengths.

## Consequences

- One codebase for every platform; only a thin native shell differs.
- The story (ink) is engine-independent and survives an engine change.
- Pixi is a renderer, not a full engine: scene management, input and UI are our own modules.
