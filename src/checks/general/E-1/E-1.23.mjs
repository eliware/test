import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.23";
export const parentRuleId = "E-1";

export async function run({ root }) {
  try {
    const license = await readFile(join(root, "LICENSE"), "utf8");
    if (!license.includes("MIT License") || !license.includes("Copyright (c) 2026 Eliware")) {
      return fail(ruleId, "LICENSE must use the MIT license with Copyright (c) 2026 Eliware.");
    }
  } catch {
    return fail(ruleId, "LICENSE is required at the repository root.");
  }
  return pass(ruleId);
}
