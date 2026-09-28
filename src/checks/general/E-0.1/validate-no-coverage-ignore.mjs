import { fail, pass } from "../../check-result.mjs";
import { collectNoCoverageIgnoreSourceFiles } from "./collect-no-coverage-ignore-source-files.mjs";
import { resolveCoverageIgnoreBarrels } from "./resolve-coverage-ignore-barrels.mjs";
import { inspectNoCoverageIgnoreSourceFiles } from "./inspect-no-coverage-ignore-source-files.mjs";

export async function runNoCoverageIgnore({
  root,
  ruleId,
  packageJson,
  repositoryInventory,
  findBarrels,
  isPureBarrel,
}) {
  try {
    const files = await collectNoCoverageIgnoreSourceFiles(root, repositoryInventory);
    const { barrels, allowedBarrels } = await resolveCoverageIgnoreBarrels(
      root,
      packageJson,
      repositoryInventory,
      findBarrels,
    );
    const failures = await inspectNoCoverageIgnoreSourceFiles({
      root,
      files,
      barrels,
      allowedBarrels,
      repositoryInventory,
      isPureBarrel,
    });
    return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, error.message);
  }
}
