import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { readRepositoryText } from "../../read-repository-text.mjs";

export const ruleId = "E-0.1.26";
export const parentRuleId = "E-0.1";

const LICENSE_MARKERS = ["MIT License", "Copyright (c) 2026 Eliware", "Permission is hereby granted"];

export async function run(context) {
  const { root } = context;
  try {
    const license = await readRepositoryText(context, join(root, "LICENSE"));
    const missing = LICENSE_MARKERS.filter((marker) => !license.includes(marker));
    if (missing.length) return fail(ruleId, `LICENSE.md is missing required license content: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "LICENSE is required and must contain the approved MIT license with Eliware attribution.");
  }
  return pass(ruleId);
}
