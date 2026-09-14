import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { findEnvironmentReferences } from "./find-environment-references.mjs";
import { parseEnvExample } from "./parse-env-example.mjs";

export const ruleId = "E-1.20.8";
export const parentRuleId = "E-1.20";

export async function run({ root }) {
  let variables;
  try {
    variables = await findEnvironmentReferences(root);
  } catch {
    return fail(ruleId, "src/ is required for environment-reference validation.");
  }
  if (variables.length === 0) return pass(ruleId);
  let example;
  try {
    example = await readFile(join(root, ".env.example"), "utf8");
  } catch {
    return fail(ruleId, "Repositories using environment variables must provide .env.example.");
  }
  const parsed = parseEnvExample(example);
  if (parsed.errors.length > 0)
    return fail(ruleId, `.env.example is invalid: ${parsed.errors.join("; ")}.`);
  const missing = variables.filter((name) => !parsed.records.has(name));
  if (missing.length > 0)
    return fail(
      ruleId,
      `Environment variables are missing from .env.example: ${missing.join(", ")}.`,
    );
  return pass(ruleId);
}
