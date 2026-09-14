import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.60.1";
export const parentRuleId = "E-1.60";

export async function run({ root, packageJson }) {
  const entrypoints = Object.values(packageJson?.bin ?? {});
  if (entrypoints.length === 0)
    return fail(ruleId, "CLI repositories must declare a bin entrypoint.");
  let readme;
  try {
    readme = await readFile(join(root, "README.md"), "utf8");
    for (const entrypoint of entrypoints) await access(join(root, entrypoint));
  } catch {
    return fail(ruleId, "Every declared CLI bin entrypoint and README.md must exist.");
  }
  for (const term of ["--help", "--version", "exit code"]) {
    if (!readme.toLowerCase().includes(term.toLowerCase()))
      return fail(ruleId, `CLI README.md must document ${term}.`);
  }
  const entrypointText = await Promise.all(
    entrypoints.map((entrypoint) => readFile(join(root, entrypoint), "utf8")),
  ).then((texts) => texts.join("\n"));
  if (
    /\b(?:publish|deploy|delete|remove|destroy|push)\b/i.test(entrypointText) &&
    !/(?:dry[- ]run|confirm|confirmation)/i.test(`${readme}\n${entrypointText}`)
  ) {
    return fail(ruleId, "Destructive CLI actions must provide dry-run or confirmation controls.");
  }
  return pass(ruleId);
}
