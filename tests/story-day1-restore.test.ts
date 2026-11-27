import { Story } from "inkjs";
import { beforeAll, describe, expect, it } from "vitest";
import { advance } from "../src/story/advance";
import { BANDS } from "../src/story/bands";
import { StoryRunner, type StoryStep } from "../src/story/runner";
import { follow, optionKinds, play, storyJson, type Kind, type Move } from "./helpers/story-day1";

const LANGS = ["en", "hu"] as const;
const last = <T>(xs: T[]): T => xs[xs.length - 1] as T;

interface Case {
  name: string;
  plan: (Kind | "good")[];
  id: "fire" | "patch";
}

const CASES: Case[] = [
  { name: "Stay, fire first", plan: ["stay", "fire"], id: "fire" },
  { name: "Stay, patch first", plan: ["stay", "patch"], id: "patch" },
  { name: "Stay, forage then fire", plan: ["stay", "forage", "fire"], id: "fire" },
  { name: "Stay, rest and play then patch", plan: ["stay", "rest_play", "patch"], id: "patch" },
  { name: "Stay, fire then patch", plan: ["stay", "fire", "good", "patch"], id: "patch" },
  { name: "Explore, fire", plan: ["explore", "fire"], id: "fire" },
];

for (const lang of LANGS) {
  describe(`AC 3c: restore inside the slot tunnel (${lang})`, () => {
    let trails: Move[][] = [];
    beforeAll(() => {
      trails = CASES.map((c) => follow(lang, c.plan));
    }, 60_000);

    it.each(CASES.map((c, i) => [c.name, i] as const))(
      "%s: restoring at the trigger and applying each band gives the same next step as playing straight through",
      (_name, i) => {
        const c = CASES[i] as Case;
        const trail = trails[i] as Move[];
        const at = play(lang, trail);
        const trigger = last(at.steps);
        expect(trigger.minigame).toBe(c.id);
        for (const band of BANDS) {
          const straight = last(play(lang, [...trail, { band }]).steps);
          const runner = new StoryRunner(storyJson(lang));
          runner.restore(trigger.checkpoint as string, c.id);
          runner.completeMinigame(band);
          const resumed: StoryStep = runner.next();
          expect(resumed.lines).toEqual(straight.lines);
          expect(resumed.choices).toEqual(straight.choices);
          expect(resumed.ended).toBe(straight.ended);
        }
      },
    );

    it("restored Stay fire-first returns to the second menu: no fire, patch offered, not the first menu", () => {
      const trail = follow(lang, ["stay", "fire"]);
      const firstMenu = last(play(lang, follow(lang, ["stay"])).steps).choices;
      const fireText = (
        firstMenu[optionKinds(lang, follow(lang, ["stay"])).indexOf("fire")] as { text: string }
      ).text;
      const patchText = (
        firstMenu[optionKinds(lang, follow(lang, ["stay"])).indexOf("patch")] as { text: string }
      ).text;
      for (const band of BANDS) {
        const runner = new StoryRunner(storyJson(lang));
        runner.restore(last(play(lang, trail).steps).checkpoint as string, "fire");
        runner.completeMinigame(band);
        const step = runner.next();
        const options = step.choices.map((o) => o.text);
        expect(options).toHaveLength(firstMenu.length - 1);
        expect(options).not.toContain(fireText);
        expect(options).toContain(patchText);
        expect(runner.getVariable("mg_fire")).toBe(band);
      }
    });

    it("restored Stay forage-then-fire goes on to the dog chance, with no third menu", () => {
      const trail = follow(lang, ["stay", "forage", "fire"]);
      for (const band of BANDS) {
        const runner = new StoryRunner(storyJson(lang));
        runner.restore(last(play(lang, trail).steps).checkpoint as string, "fire");
        runner.completeMinigame(band);
        const step = runner.next();
        expect(step.choices).toHaveLength(2);
        expect(step.ended).toBe(false);
        runner.choose(0);
        const after = runner.next();
        expect(after.ended).toBe(true);
        expect(runner.getVariable("mg_patch")).toBe("");
      }
    });

    it("the same round trip through the raw inkjs state JSON (ToJson, LoadJson) resumes at the same place", () => {
      for (const [i, c] of CASES.entries()) {
        const trail = trails[i] as Move[];
        const checkpoint = last(play(lang, trail).steps).checkpoint as string;
        for (const band of BANDS) {
          const straight = last(play(lang, [...trail, { band }]).steps);
          const raw = new Story(storyJson(lang));
          raw.state.LoadJson(checkpoint);
          raw.variablesState.$(`mg_${c.id}`, band);
          const { lines, stop } = advance(raw);
          expect(lines).toEqual(straight.lines);
          expect(raw.currentChoices.map((o) => ({ index: o.index, text: o.text }))).toEqual(
            straight.choices,
          );
          expect(stop.kind === "end").toBe(straight.ended);
        }
      }
    });
  });
}
