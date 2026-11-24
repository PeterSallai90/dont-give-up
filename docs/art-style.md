# Art style

Status: first draft (2026-11-24). The owner confirms or changes the look after the first visual
prototype; until then these rules are the brief.

## Direction

A colourful take on 1930s "rubber hose" cartoons: bendy limbs without elbows, round shapes,
big expressive eyes, white gloves are optional, bouncy motion. Unlike the black-and-white
originals, the palette is warm and rich. Mood: winter cold outside, warm light inside; hope grows
as the manor is rebuilt, and the colours grow warmer with it.

Original characters only. Never copy, trace or closely imitate existing cartoon characters,
studios' signature designs or other games.

## Shapes and lines

- Bold, clean outlines (2 to 4 px at 1x phone size), slightly darker than the fill, not pure black.
- Simple flat fills with at most one shade tone per colour; no gradients on characters.
  Backgrounds may use soft gradients for light and sky.
- Readable silhouettes: every character and interactive prop is recognisable as a solid shape.
- Interactive objects have a slightly thicker outline than decoration.

## Palette (starting point)

| Role             | Hex                                               |
| ---------------- | ------------------------------------------------- |
| Night background | #1B1430                                           |
| Deep shadow      | #2E2347                                           |
| Snow / paper     | #F4E9D8                                           |
| Warm light       | #FFD166                                           |
| Fire             | #F77F00                                           |
| Brick / danger   | #D62828                                           |
| Friendly green   | #5FAD56                                           |
| Cold blue        | #4D9DE0                                           |
| Skin tones       | chosen per character, recorded in the story bible |

## Assets

- Vector first: SVG with named groups per body part (for animation), colours only from the
  palette. Raster exports when a performance test asks for it.
- Budgets: a character SVG under 60 KB, a background under 150 KB, both gzip-compressed sizes
  reported in the issue.
- Previews at phone size and 2x, on the night background and on the snow background.

## Motion

- Bouncy, squash-and-stretch motion with a lively rhythm.
- Respect `prefers-reduced-motion`: large motion becomes small motion or a fade.

## Typography

Readable first: body text at least 16 px on phones, with high contrast. A decorative display
font is allowed for titles only, with a licence row in docs/asset-licenses.md.
