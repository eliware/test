import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.26.0";
export const parentRuleId = "E-1.26";

export async function run({ root, packageJson }) {
  try {
    const [notes, readme] = await Promise.all([
      readFile(join(root, "RELEASE_NOTES.md"), "utf8"),
      readFile(join(root, "README.md"), "utf8"),
    ]);
    const version = packageJson?.version;
    if (
      typeof version !== "string" ||
      !new RegExp(`^##\\s+${version.replaceAll(".", "\\.")}\\s*$`, "m").test(notes)
    ) {
      return fail(ruleId, "RELEASE_NOTES.md must contain the current package version heading.");
    }
    if (!readme.includes("RELEASE_NOTES.md"))
      return fail(ruleId, "README.md must link RELEASE_NOTES.md.");
  } catch {
    return fail(
      ruleId,
      "RELEASE_NOTES.md and README.md are required for release-bearing repositories.",
    );
  }
  return pass(ruleId);
}
