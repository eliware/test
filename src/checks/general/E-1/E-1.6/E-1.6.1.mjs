import { fail, pass } from "../../../check-result.mjs";
import { findRepositoryFiles } from "../find-repository-files.mjs";

export const ruleId = "E-1.6.1";
export const parentRuleId = "E-1.6";

const prohibitedName =
  /(?:^|[._-])(backup|backups|dump|dumps|restore|restores|runtime[-_ ]?state)(?:$|[._-])/i;
const prohibitedExtension = /\.(?:bak|dump|dmp|sql\.gz|tar\.gz|zip)$/i;

export async function run({ root }, findFiles = findRepositoryFiles) {
  try {
    const findings = (await findFiles(root)).filter(
      (file) => prohibitedName.test(file) || prohibitedExtension.test(file),
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
