import { Compiler, CompilerOptions } from "inkjs/compiler/Compiler";

/** Compiles an inline ink source into the compiled story JSON string. Throws on compile errors. */
export function compileInk(source: string): string {
  const errors: string[] = [];
  const compiler = new Compiler(
    source,
    new CompilerOptions(null, [], false, (message: string, type: number) => {
      if (type === 2) errors.push(message);
    }),
  );
  const story = compiler.Compile();
  if (errors.length > 0) throw new Error(`ink fixture did not compile: ${errors.join("; ")}`);
  return story.ToJson() ?? "";
}
