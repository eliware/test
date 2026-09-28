import { resolve } from "node:path";
import { execute } from "../../execute-child-process.mjs";

export async function executeLibraryExamples(root, examples, executeExample = execute) {
  const failures = [];
  for (const example of examples) {
    let result;
    try {
      result = await executeExample(process.execPath, [resolve(root, "examples", example.name)], {
        cwd: root,
      });
    } catch (error) {
      failures.push(`Example ${example.name} could not run: ${error.message}`);
      continue;
    }
    if (result.code !== 0) {
      const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
      failures.push(`Example ${example.name} failed${detail ? `: ${detail}` : "."}`);
    }
  }
  return failures.length ? failures.join("\n") : null;
}
