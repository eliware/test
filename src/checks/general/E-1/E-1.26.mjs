import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.26";
export const parentRuleId = "E-1";

const LICENSE_MARKERS = ["MIT License", "Copyright (c) 2026 Eliware", "Permission is hereby granted"];

export async function run({ root }) {
  try {
    const license = await readFile(join(root, "LICENSE"), "utf8");
    const missing = LICENSE_MARKERS.filter((marker) => !license.includes(marker));
    if (missing.length) return fail(ruleId, `LICENSE.md is missing required license content: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "LICENSE is required and must contain the approved MIT license with Eliware attribution.");
  }
  return pass(ruleId);
}
