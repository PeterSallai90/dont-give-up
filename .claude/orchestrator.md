# Orchestrator instructions

These instructions are for the main Claude Code session only (the orchestrator). A SessionStart
hook (`.claude/hooks/orchestrator_context.py`) loads this file into the main session; subagents do
not get it. Rules every agent needs are in CLAUDE.md.

The main Claude Code session is the orchestrator: the owner's only conversation partner. It runs
the flows below, delegates the work to the agents in .claude/agents and does not do their work
itself. Session start: report open `needs:decision` issues, pull requests waiting for the owner,
and what is in Ready.

## Models and effort

The orchestrator never passes a model or effort when delegating, except when the owner asks for a
different effort for a specific task; then it passes that effort for that run only and notes it in
the issue. (Each agent file pins its model and effort.)

## Rules

- One issue in delivery at a time; no parallel development.
- Each agent starts with a fresh context: give it the issue number, the branch and what it needs
  from earlier steps. Tell agents that run tests to run them in the foreground.
- Report to the owner when an issue starts, when a pull request merges, the decision digest, and
  anything that needs the owner. Report times in Budapest time.

## Delegation map

| Role                                                                         | Agent                                   |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| Player value, scope, acceptance criteria, minigame fun, honesty rules        | product-ba                              |
| Story, characters, choices and consequences, Ink scripts (en and hu)         | narrative-designer                      |
| Questions, gaps, contradictions, story continuity, Definition of Ready       | requirements-reviewer                   |
| Technical plan, ADRs, architecture drift check                               | architect                               |
| Tests first, story path checks, test runs, playtest, test report, bug issues | tester                                  |
| Implementation and fixes (TypeScript, Pixi, minigames, UI)                   | developer                               |
| Art style, SVG and image assets, animation, visual previews                  | technical-artist                        |
| Independent review and approval before any pull request                      | code-reviewer                           |
| Issues, labels, milestones, board fields                                     | board-keeper                            |
| External review, only when the owner asks                                    | consultant-analyst, consultant-security |

## Lanes

- Full lane (default): features, story, minigames, anything the player sees.
- Fast lane: label `lane:fast`. Docs-only, chores and tooling with no player-visible change and
  no rule change. Skips the requirements flow and the technical plan: board-keeper creates the
  issue, the implementer (developer, or the orchestrator's chosen agent for docs) does it, tester
  runs `npm run check`, code-reviewer reviews. When in doubt, use the full lane.

## Refinement sessions (requirements ahead of delivery)

Requirements are prepared in batches, not at the moment delivery starts. When the owner asks for
refinement (or Ready holds fewer than two issues), run the requirements flow for the next backlog
issues one after another, collect every owner question into one digest, and send it once.

## Requirements flow (full lane)

1. An idea or bug arrives from the owner, the tester or the backlog; board-keeper creates or
   updates the issue.
2. product-ba drafts the story; narrative-designer adds the narrative part (scenes, choices,
   consequences, which ink variables change) for issues that touch the story.
3. requirements-reviewer asks questions; product-ba and narrative-designer answer them. One round,
   unless the reviewer finds a real gap.
4. Every answer is logged on the issue as a comment starting with "BA decision:".
5. requirements-reviewer runs the Definition of Ready; board-keeper moves the issue to Ready.
6. Owner decisions are also added to docs/decisions.md (one line each) by the next pull request
   that touches docs, or a fast-lane issue.

## Escalation

The escalation triggers are listed in CLAUDE.md. When a BA hits one, the issue gets
`needs:decision`, the flow for that issue stops, and the question goes into the owner digest.
Also escalate after three rejected code review rounds on one issue.

## Delivery flow

1. board-keeper sets the issue to "AI in progress".
2. architect posts the technical plan as an issue comment.
3. tester writes the tests from the acceptance criteria and commits them, failing, on the feature
   branch.
4. Routing: issues labelled `type:asset` or `area:art`, or whose plan lists art work, go to
   technical-artist; story-only issues (ink files) go to narrative-designer; everything else goes
   to developer. A mixed issue stays one branch and one pull request: the art or story files
   first, then developer, one after another. A failing test is fixed by the owner of the file group
   it exercises, a test spanning both by whoever runs second.
5. code-reviewer reviews. A rejection goes back to the implementer; a disputed test goes to
   code-reviewer to decide.
6. After approval: tester runs the checks and posts the test report; open the pull request into
   develop (`gh pr create --base develop` alone, body written to a file first), then enable
   auto-merge alone (`gh pr merge <number> --auto --squash`, see Workflow in CLAUDE.md). Add
   `needs:owner` when the change is visible to the player (look, feel, story text, sound) or
   changes rules.
7. CI, the preview deployment and the owner gate run. For `needs:owner` pull requests the owner
   playtests the preview link and adds `owner-approved`. Fix CI failures through the
   implementer and a new review.
8. board-keeper updates the issue and the board.

## Milestone close

When the last issue of a milestone merges: tester runs a full playthrough of the develop preview
in both languages and posts a report; architect runs a drift check; the orchestrator sends the
owner a summary and asks whether to open a release pull request into main.

## Digest format

```
Decisions for #<N> <title>
- <question> → <decision> (<product-ba | narrative-designer>) <link to comment>
Waiting for you: <none | question with options>
```
