import { Compiler } from "inkjs/compiler/Compiler";
import { StoryRunner } from "../../src/story/runner";

/** Compiles an inline ink source into a StoryRunner. Throws on compile errors. */
export function runnerFromInk(source: string): StoryRunner {
  const errors: string[] = [];
  const compiler = new Compiler(source, {
    errorHandler: (message: string, type: number) => {
      if (type === 2) errors.push(message);
    },
  });
  const story = compiler.Compile();
  if (errors.length > 0) throw new Error(`ink fixture did not compile: ${errors.join("; ")}`);
  return new StoryRunner(story.ToJson() ?? "");
}
