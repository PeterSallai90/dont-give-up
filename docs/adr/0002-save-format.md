# 0002 Save format, storage key and storage interface

- Status: Accepted (pull request for #16)

## Context

D24 says that leaving the app mid-minigame resumes at the trigger point. The story bible
("Minigame and choice contract", "Leaving during a minigame") places that point at the
`# minigame: <id>` tag, after the lead-in lines. The runner from #15 stops there and returns the
ink state JSON as `StoryStep.checkpoint`; `restore(checkpoint, pending)` puts a runner back into
the trigger-pending state. #16 turns that into a stored save, and #35 (autosave at every choice)
reuses the same format.

Constraints:

- CLAUDE.md: state the story reads lives in ink variables; TypeScript keeps no second copy.
- Tags are not part of the ink state (`currentTags` is transient), so the pending minigame id and
  the current `# scene:` id cannot be read back from a loaded ink state.
- `game_mode` (D21) is stored with the save and stays outside ink (bible, "Game modes").
- The develop site and every pull request preview share one origin
  (`petersallai90.github.io`), so they share one `localStorage`.
- Every story edit recompiles the ink; an ink state from another compile can load into the wrong
  place or throw later.
- Capacitor storage (Preferences) is asynchronous; `localStorage` is synchronous and can throw
  (quota, private mode, blocked storage).
- inkjs keeps a pending variable and visit-count patch while a look-ahead snapshot is open
  (`Story.StateSnapshot`, used by `ContinueSingleStep`); `StoryState.ToJson()` writes only the
  committed values, so a write made while the patch is open can be missing from the JSON (#16
  AC 17).

## Decision

### 1. One document per save

A save is one JSON document with a header and the ink state:

```json
{
  "header": {
    "version": 1,
    "storyBuildId": "3f9a0c1d2b4e5f60",
    "language": "en",
    "timestamp": "2026-11-27T15:00:00.000Z",
    "game_mode": "normal",
    "scene": "wood_crash",
    "pending": "fire"
  },
  "ink": "<the ink state JSON, as the string StoryState.ToJson() returns>"
}
```

| Field          | Type and rule                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------- |
| `version`      | Integer. The only supported value is `1`. Any other value is unsupported.                     |
| `storyBuildId` | String. Build id of the compiled story of `language` (section 5).                             |
| `language`     | A supported language code (`en`, `hu`). The ink state belongs to that language's story.       |
| `timestamp`    | ISO 8601 UTC string of the write. Information only; no logic reads it in M1.                  |
| `game_mode`    | `easy` or `normal`. The single store of the mode (section 3).                                 |
| `scene`        | Optional string. The id of the last `# scene:` tag the game showed. Unknown ids are no error. |
| `pending`      | Optional string, minigame id pattern `[a-z][a-z0-9_]*`. Present only on a trigger checkpoint. |
| `ink`          | String, the ink state JSON.                                                                   |

Unknown extra header fields are ignored. There is no `chapter` field (it has no source in M1).
A missing required field or a wrong type makes the whole save invalid.

### 2. Ink state is the only story state

Nothing in the header is read by ink or changes story text. `version`, `storyBuildId` and
`timestamp` describe the save. `language` names the story build the ink state belongs to.
`pending` and `scene` are UI position pointers: they say where the screen was, because tags are
not part of the ink state; the story never reads them. A future field that the story would read is
an ink variable instead, never a header field.

### 3. game_mode has one store

The header's `game_mode` is the only stored copy of the mode. The settings selector (#14) changes
it only through the save API, which rewrites the stored header. Before the first save exists the
pick is kept in memory and goes into the first save. A restarted round uses the mode in the header
at resume time.

### 4. Storage key

The key is `dontgiveup.save.1:<basePath>`, where `<basePath>` is the path of the folder that
serves the page: `new URL("./", location.href).pathname`, for example `/dont-give-up/` for
develop and `/dont-give-up/pr-preview/pr-16/` for a preview. Query strings (`?lang=`) are not
part of it. The `1` is the version of the key scheme and changes only if the key scheme changes;
the save format version lives in the header, so an older build still finds a newer save under the
same key and can leave it untouched (#16 AC 10). There is one slot per base path; no save slots.

### 5. Story build id

`storyBuildId` is the first 16 hex characters of the SHA-256 of the compiled story JSON of one
language, exactly as `tools/compile-story.ts` writes it. The compile step writes the ids into
`src/generated/` (gitignored), so the game computes no hash at runtime. A save whose id differs
from the running build's id for `header.language` is treated as no save.

### 6. Storage interface

Storage is an asynchronous key-value interface (`get`, `set`, `remove`, each returning a
promise). The web adapter wraps `localStorage`; an in-memory implementation serves Node tests;
a Capacitor adapter comes later behind the same interface, through its own issue. Save logic never
touches `localStorage` directly and runs in Node without a browser.

### 7. Loading

A stored value is a valid save only if it parses, has every required field with the right type,
has `version` 1, a supported `language` and the running build's `storyBuildId` for that
language, and its ink state loads and runs (a probe on a throwaway runner: restore, write a band,
read the next stop). Anything else is "no save": the start screen, silently, with no half-loaded
runner. A save with a higher `version` is also "no save", and the game does not overwrite it
until the player starts a new game. No migration exists for version 1; a version 2 brings its own
migration rule.

On a valid save the game opens at the saved position in the saved language (a different `?lang=`
or browser language applies from a new game) with the saved `game_mode` and `scene`.

### 8. Writing

- Saves are written only at stops: at a trigger, before the minigame view starts (`pending`
  set); after an accepted band, at the next stop (a trigger checkpoint replaces the old one; a
  choice stop removes the old checkpoint until #35 writes a choice save there).
- The ink state is taken only through the story runner, the only code that talks to inkjs. The
  runner commits any open inkjs patch before `ToJson()`, so a value written through
  `completeMinigame` is never missing from a save.
- A write is `set`; if `set` fails, the old save is removed, so a failed write leaves no save
  rather than a stale checkpoint that would replay a finished minigame. Storage errors never reach
  the player: no message, no prompt, play continues.

## Alternatives considered

- Re-derive the pending id by replaying the lead-in lines after a load: replays lines (#16 AC 3
  forbids it) and needs output suppression; rejected.
- `game_mode` or the scene as ink variables: the bible keeps the mode outside ink, and a settings
  change mid-round would write story state; the BAs chose the header for the scene so no authoring
  rule or lint is needed. Rejected.
- Format version in the storage key: an older build would never see a newer save and could not
  protect it (#16 AC 10). Rejected.
- Synchronous storage interface: fits `localStorage` only and would be reversed for Capacitor.
  Rejected.
- IndexedDB: more code for a document of a few kilobytes. Rejected for now.
- Hashing the story at runtime with `crypto.subtle`: costs boot time on every start. Rejected.
- Migrations or a story-stable save across story edits: nothing to migrate yet. Deferred.

## Consequences

- Every story change that ships invalidates saves in progress for that language: the player sees
  the start screen. This is accepted for M1. Before a public release a follow-up decision must say
  how saves survive a story update (an owner question then, because players lose progress).
- Previews and the develop site never read or overwrite each other's save.
- #35 reuses the format with `pending` absent; #14 writes `game_mode` through the save API and
  owns the "new game" entry that clears the slot; #18 owns the scene ids and the default
  background.
- docs/architecture.md ("Story and state") still lists a `chapter` field; #23 updates it to this
  ADR.
