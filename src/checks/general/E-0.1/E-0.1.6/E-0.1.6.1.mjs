import { fail, pass } from "../../../check-result.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";

export const ruleId = "E-0.1.6.1";
export const parentRuleId = "E-0.1.6";

const prohibitedName =
  /(?:^|[._-])(backup|backups|dump|dumps|restore|restores|runtime[-_ ]?state)(?:$|[._-])/i;
const prohibitedExtension = /\.(?:bak|dump|dmp|sql\.gz|tar\.gz|zip)$/i;
const shellScript = /\.sh$/i;

const hasProhibitedName = (path) => {
  const segments = path.split(/[\\/]/);
  const fileName = segments.pop();
  return (
    segments.some((segment) => prohibitedName.test(segment)) ||
    (prohibitedName.test(fileName) && !shellScript.test(fileName))
  );
};

export async function run({ root, repositoryInventory }, findFiles = findRepositoryFiles) {
  try {
    const files = repositoryInventory
      ? await repositoryInventory.repositoryFiles()
      : await findFiles(root);
    const findings = files.filter(
      (file) => hasProhibitedName(file) || prohibitedExtension.test(file),
    );
    return findings.length === 0
      ? pass(ruleId)
      : fail(
          ruleId,
          `Repository contains prohibited backup or runtime-state files: ${findings.join(", ")}.`,
        );
  } catch (error) {
    return fail(ruleId, error.message);
  }
}
