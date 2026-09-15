import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { execute } from "../../execute-child-process.mjs";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.60.1";
export const parentRuleId = "E-1.60";

export async function run({ root, packageJson, executeEntrypoint = execute }) {
  const entrypoints = typeof packageJson?.bin === "string"
    ? [packageJson.bin]
    : Object.values(packageJson?.bin ?? {});
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
  for (const entrypoint of entrypoints) {
    for (const argument of ["--help", "--version"]) {
      let result;
      try {
        result = await executeEntrypoint(process.execPath, [resolve(root, entrypoint), argument], { cwd: root });
      } catch (error) {
        return fail(ruleId, `CLI entrypoint ${entrypoint} could not execute ${argument}: ${error.message}`);
      }
      if (result.code !== 0) {
        return fail(ruleId, `CLI entrypoint ${entrypoint} must exit 0 for ${argument}; received ${result.code}.`);
      }
      const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
      if (!output) return fail(ruleId, `CLI entrypoint ${entrypoint} must produce output for ${argument}.`);
      if (argument === "--version" && typeof packageJson?.version === "string" && !output.includes(packageJson.version)) {
        return fail(ruleId, `CLI entrypoint ${entrypoint} --version must report package version ${packageJson.version}.`);
      }
    }
  }
  return pass(ruleId);
}
