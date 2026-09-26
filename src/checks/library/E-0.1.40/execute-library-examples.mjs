import { resolve } from "node:path";
import { execute } from "../../execute-child-process.mjs";

export async function executeLibraryExamples(root, examples, executeExample = execute) {
  for (const example of examples) {
    let result;
    try {
      result = await executeExample(process.execPath, [resolve(root, "examples", example.name)], { cwd: root });
    } catch (error) {
      return `Example ${example.name} could not run: ${error.message}`;
    }
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      return `Example ${example.name} failed${detail ? `: ${detail}` : "."}`;
    }
  }
  return null;
}
