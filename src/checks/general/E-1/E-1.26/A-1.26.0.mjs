import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "A-1.26.0";
export const parentRuleId = "E-1.26";

function hasCurrentReleaseHeading(notes, version) {
  return notes.split(/\r?\n/u).some((line) => {
    const match = /^## ([^\s]+) — (\d{4}-\d{2}-\d{2})$/u.exec(line);
    if (!match || match[1] !== version) return false;
    const date = new Date(`${match[2]}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === match[2];
  });
}

export async function run({ root, packageJson }) {
  try {
    const [notes, readme] = await Promise.all([
      readFile(join(root, "RELEASE_NOTES.md"), "utf8"),
      readFile(join(root, "README.md"), "utf8"),
    ]);
    const version = packageJson?.version;
    if (typeof version !== "string" || !hasCurrentReleaseHeading(notes, version)) {
      return fail(ruleId, "RELEASE_NOTES.md must contain the current package version heading.");
    }
    if (!/^###\s+(?:Added|Changes|User-visible changes)\s*$/im.test(notes)) {
      return fail(ruleId, "RELEASE_NOTES.md must contain a user-visible changes section.");
    }
    if (!/^###\s+(?:Fixed|Fixes)\s*$/im.test(notes)) {
      return fail(ruleId, "RELEASE_NOTES.md must contain a fixes section.");
    }
    if (!/\[[^\]]+\]\((?:\.\/)?RELEASE_NOTES\.md(?:#[^)]+)?\)/iu.test(readme))
      return fail(ruleId, "README.md must link RELEASE_NOTES.md.");
  } catch {
    return fail(
      ruleId,
      "RELEASE_NOTES.md and README.md are required for release-bearing repositories.",
    );
  }
  return pass(ruleId);
}
