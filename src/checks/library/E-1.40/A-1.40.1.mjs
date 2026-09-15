import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execute } from "../../execute-child-process.mjs";
import { fail, pass } from "../../check-result.mjs";
import { validateExamplesIndex } from "./validate-examples-index.mjs";

export const ruleId = "A-1.40.1";
export const parentRuleId = "E-1.40";

export async function run({ root, packageJson, executeExample = execute }) {
  try {
    await readFile(join(root, "docs", "README.md"), "utf8");
    await readFile(join(root, "examples", "README.md"), "utf8");
    const examples = await readdir(join(root, "examples"), { withFileTypes: true });
    const exampleNames = examples.filter((entry) => entry.name !== "README.md").map((entry) => entry.name);
    const runnableExamples = examples.filter((entry) => entry.isFile() && /\.(?:cjs|js|mjs)$/iu.test(entry.name));
    if (runnableExamples.length === 0)
      return fail(ruleId, "Libraries must provide at least one runnable example.");
    const indexError = validateExamplesIndex(await readFile(join(root, "examples", "README.md"), "utf8"), exampleNames);
    if (indexError) return fail(ruleId, indexError);
    for (const example of runnableExamples) {
      let result;
      try {
        result = await executeExample(process.execPath, [resolve(root, "examples", example.name)], { cwd: root });
      } catch (error) {
        return fail(ruleId, `Example ${example.name} could not run: ${error.message}`);
      }
      if (result.code !== 0) {
        const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
        return fail(ruleId, `Example ${example.name} failed${detail ? `: ${detail}` : "."}`);
      }
    }
    if (!packageJson?.files?.length)
      return fail(ruleId, "Libraries must declare a package file allowlist.");
  } catch {
    return fail(ruleId, "Libraries must provide complete docs/ and examples/ indexes.");
  }
  return pass(ruleId);
}
