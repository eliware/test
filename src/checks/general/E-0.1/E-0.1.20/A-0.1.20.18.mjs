import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { isDeepStrictEqual } from "node:util";
import { fail, pass } from "../../../check-result.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";

export const ruleId = "A-0.1.20.18";
export const parentRuleId = "E-0.1.20";
const conventionUrl = new URL("../../../../../specs/conventions/general.yaml", import.meta.url);

export async function run({ root, packageJson, repositoryInventory }) {
  try {
    const document = parse(await readFile(conventionUrl, "utf8"));
    const required = resolveCanonicalPrettierConfiguration(document);
    const prettier = packageJson?.prettier;
    if (!prettier || typeof prettier !== "object" || Array.isArray(prettier))
      return fail(
        ruleId,
        "package.json must contain the canonical Eliware Prettier configuration.",
      );
    if (!isDeepStrictEqual(prettier, required))
      return fail(
        ruleId,
        "package.json must contain the canonical Eliware Prettier configuration.",
      );
    const files = repositoryInventory
      ? await repositoryInventory.files("all")
      : await findRepositoryFiles(root);
    const configs = files.filter((file) =>
      /(?:^|\/)(?:\.prettierrc(?:\..+)?|prettier\.config(?:\..+)?)$/iu.test(file),
    );
    if (configs.length)
      return fail(
        ruleId,
        `Standalone Prettier configuration files are not allowed: ${configs.join(", ")}.`,
      );
  } catch (error) {
    return fail(ruleId, `Prettier configuration could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}

export function resolveCanonicalPrettierConfiguration(document) {
  const directive = findDirective(document?.directives, ruleId);
  const example = directive?.examples?.find(
    ({ purpose }) => purpose === "Canonical package.json Prettier configuration",
  );
  const json = example?.markdown?.match(/```json\s*([\s\S]*?)```/iu)?.[1];
  if (!json) throw new Error("general.yaml must define the canonical Prettier JSON configuration.");
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
