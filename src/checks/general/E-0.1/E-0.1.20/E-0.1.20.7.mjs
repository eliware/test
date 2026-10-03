import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { isDeepStrictEqual } from "node:util";
import { fail, pass } from "../../../check-result.mjs";
import { findJestConfigFiles } from "./find-jest-config-files.mjs";

export const ruleId = "E-0.1.20.7";
export const parentRuleId = "E-0.1.20";
export const focusedSafe = true;
export const repositoryInventoryOptions = { includeTestResults: true };
const conventionUrl = new URL("../../../../../specs/conventions/general.yaml", import.meta.url);

export async function run({ root, packageJson, repositoryInventory }) {
  try {
    const document = parse(await readFile(conventionUrl, "utf8"));
    const required = resolveCanonicalJestConfiguration(document);
    if (!isDeepStrictEqual(packageJson?.jest, required))
      return fail(ruleId, "package.json must contain the canonical Eliware Jest configuration.");
    const configs = await findJestConfigFiles(root, repositoryInventory);
    if (configs.length > 0)
      return fail(
        ruleId,
        "Jest configuration must live in package.json; found separate config files.",
      );
  } catch (error) {
    return fail(ruleId, `Jest configuration files could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}

export function resolveCanonicalJestConfiguration(document) {
  const directive = findDirective(document?.directives, ruleId);
  const example = directive?.examples?.find(
    ({ purpose }) => purpose === "Canonical package.json Jest configuration",
  );
  const json = example?.markdown?.match(/```json\s*([\s\S]*?)```/iu)?.[1];
  if (!json) throw new Error("general.yaml must define the canonical Jest JSON configuration.");
  return JSON.parse(json);
}

function findDirective(directives, id) {
  for (const directive of directives ?? []) {
    if (directive.id === id) return directive;
    const nested = findDirective(directive.directives, id);
    if (nested) return nested;
  }
  return null;
}
