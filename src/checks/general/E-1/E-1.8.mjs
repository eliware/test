import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { readTrackedPaths } from "./E-1.6/read-tracked-paths.mjs";
import { findRepositoryFiles } from "./find-repository-files.mjs";
import { validateMailboxOwner } from "./validate-mailbox-owner.mjs";
import { validateMailboxTemplates } from "./validate-mailbox-templates.mjs";
import { isIgnoredByGit } from "./check-git-ignore.mjs";
import { resolveMailboxTemplateFiles } from "./resolve-mailbox-template-files.mjs";

export const ruleId = "E-1.8";
export const parentRuleId = "E-1";

export async function run({ root, packageJson, trackedFiles, findFiles = findRepositoryFiles, checkIgnored = isIgnoredByGit }) {
  const repositoryName = packageJson?.name?.replace(/^@[^/]+\//, "");
  if (!repositoryName) {
    return fail(ruleId, "package.json.name is required to derive the mailbox owner.");
  }

  const expected = `${repositoryName}@eliware.org`;
  let localEnvironment;
  try {
    localEnvironment = await readFile(join(root, ".env"), "utf8");
  } catch {
    return fail(ruleId, `Local .env must define the mailbox owner as ${expected}.`);
  }

  if (!validateMailboxOwner(localEnvironment, expected)) {
    return fail(ruleId, `Local .env must define the mailbox owner as ${expected}.`);
  }

  const gitTracked = trackedFiles ?? await readTrackedPaths(root);
  const tracked = new Set(gitTracked ?? []);
  if (tracked?.has(".env")) {
    return fail(ruleId, "The local mailbox owner file .env must remain untracked.");
  }
  if (!(await checkIgnored(root, ".env"))) {
    return fail(ruleId, "The local mailbox owner file .env must be ignored by Git.");
  }

  let files;
  try {
    files = await findFiles(root);
  } catch (error) {
    return fail(ruleId, `Environment files could not be inspected: ${error.message}`);
  }
  const templateFiles = await resolveMailboxTemplateFiles(
    files,
    gitTracked,
    (file) => checkIgnored(root, file),
  );
  const templateError = await validateMailboxTemplates(root, templateFiles);
  if (templateError) return fail(ruleId, templateError);
  return pass(ruleId);
}
