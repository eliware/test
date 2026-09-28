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
  const failures = [];
  const repositoryName = packageJson?.name?.replace(/^@[^/]+\//, "");
  if (!repositoryName) {
    failures.push("package.json.name is required to derive the mailbox owner.");
  } else {
    const expected = `${repositoryName}@eliware.org`;
    const owner = await inspectLocalMailboxOwner(root, expected, {
      checkIgnored,
    });
    if (owner.error) failures.push(owner.error);
  }

  let files;
  try {
    files = repositoryInventory
      ? await repositoryInventory.repositoryFiles()
      : await findFiles(root);
  } catch (error) {
    failures.push(`Environment files could not be inspected: ${error.message}`);
    return fail(ruleId, failures.join("\n"));
  }
  const templateFiles = await resolveMailboxTemplateFiles(root, files, checkIgnored);
  const templateError = await validateMailboxTemplates(
    root,
    templateFiles,
    repositoryInventory ? { repositoryInventory } : null,
  );
  if (templateError) failures.push(templateError);
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
