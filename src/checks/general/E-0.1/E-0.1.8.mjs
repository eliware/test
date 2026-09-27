import { fail, pass } from "../../check-result.mjs";
import { findRepositoryFiles } from "./find-repository-files.mjs";
import { validateMailboxTemplates } from "./validate-mailbox-templates.mjs";
import { resolveMailboxTemplateFiles } from "./resolve-mailbox-template-files.mjs";
import { inspectLocalMailboxOwner } from "./inspect-local-mailbox-owner.mjs";

export const ruleId = "E-0.1.8";
export const parentRuleId = "E-0.1";

export async function run({
  root,
  packageJson,
  repositoryInventory,
  findFiles = findRepositoryFiles,
  checkIgnored,
}) {
  const repositoryName = packageJson?.name?.replace(/^@[^/]+\//, "");
  if (!repositoryName) {
    return fail(ruleId, "package.json.name is required to derive the mailbox owner.");
  }

  const expected = `${repositoryName}@eliware.org`;
  const owner = await inspectLocalMailboxOwner(root, expected, {
    checkIgnored,
  });
  if (owner.error) return fail(ruleId, owner.error);

  let files;
  try {
    files = repositoryInventory
      ? await repositoryInventory.repositoryFiles()
      : await findFiles(root);
  } catch (error) {
    return fail(ruleId, `Environment files could not be inspected: ${error.message}`);
  }
  const templateFiles = await resolveMailboxTemplateFiles(root, files, checkIgnored);
  const templateError = await validateMailboxTemplates(
    root,
    templateFiles,
    repositoryInventory ? { repositoryInventory } : null,
  );
  if (templateError) return fail(ruleId, templateError);
  return pass(ruleId);
}
