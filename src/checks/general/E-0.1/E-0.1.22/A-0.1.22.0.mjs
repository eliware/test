import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { fail, pass } from "../../../check-result.mjs";
import { validateUniqueSpecificationDirectiveIds } from "./validate-unique-specification-directive-ids.mjs";
import { validateSpecificationDirectiveDocuments } from "./validate-specification-directive-documents.mjs";
import { loadRepoMapRecord } from "../load-repo-map-record.mjs";

export const ruleId = "A-0.1.22.0";
export const parentRuleId = "E-0.1.22";

export async function run(context) {
  const { root, repositoryInventory } = context;
  let document;
  try {
    const file = join(root, "specs", "directives.yaml");
    document = repositoryInventory
      ? await repositoryInventory.readParsed(file, "yaml-document", parse)
      : parse(await readFile(file, "utf8"));
  } catch {
    return fail(ruleId, "specs/directives.yaml is required and must be valid YAML.");
  }
  if (!Array.isArray(document.directives) || document.directives.length === 0) {
    return fail(ruleId, "specs/directives.yaml must contain one or more directives.");
  }
  const map = loadRepoMapRecord(root, context.packageJson);
  if (map.error) return fail(ruleId, map.error);
  const eliwareId = map.available ? map.record?.id : context.packageJson?.eliware?.id;
  if (typeof eliwareId !== "string" || !/^E-\d+$/u.test(eliwareId))
    return fail(ruleId, "package.json.eliware.id or the repo-map E-number is required.");
  const errors = await validateSpecificationDirectiveDocuments(
    root,
    repositoryInventory,
    eliwareId,
  );
  const uniquenessError = await validateUniqueSpecificationDirectiveIds(root, repositoryInventory);
  if (uniquenessError) errors.push(uniquenessError);
  return errors.length > 0 ? fail(ruleId, errors.join(" ")) : pass(ruleId);
}
