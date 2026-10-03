import { fail, pass } from "../../../check-result.mjs";
import { readTrackedSymlinks } from "./read-tracked-symlinks.mjs";

export const ruleId = "A-0.1.29.0";
export const parentRuleId = "E-0.1.29";

export async function run({ root, readSymlinks = readTrackedSymlinks }) {
  const symlinks = await readSymlinks(root);
  if (!Array.isArray(symlinks))
    return fail(ruleId, "Git index inspection was unavailable; cannot verify tracked symlinks.");
  if (symlinks.length > 0)
    return fail(ruleId, `Tracked symlink entries are prohibited: ${symlinks.join(", ")}.`);
  return pass(ruleId);
}
