import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.23";
export const parentRuleId = "E-1";

export async function run({ root }) {
  try {
    const license = await readFile(join(root, "LICENSE"), "utf8");
    const required = [
      "MIT License",
      "Copyright (c) 2026 Eliware",
      "Permission is hereby granted",
      "THE SOFTWARE IS PROVIDED \"AS IS\"",
      "WITHOUT WARRANTY OF ANY KIND",
      "IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE",
    ];
    const normalized = license.replace(/\s+/gu, " ");
    const missing = required.filter((marker) => !normalized.includes(marker.replace(/\s+/gu, " ")));
    if (missing.length > 0) return fail(ruleId, `LICENSE is missing approved MIT text: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "LICENSE is required at the repository root.");
  }
  return pass(ruleId);
}
