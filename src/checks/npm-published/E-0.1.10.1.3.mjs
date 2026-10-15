import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fail, pass } from "../check-result.mjs";
import { validateGitOrigin } from "./E-0.1.10.1.3/validate-git-origin.mjs";

const executeFile = promisify(execFile);

export const ruleId = "E-0.1.10.1.3";

export async function run(context = {}) {
  const errors = await validateGitOrigin(
    context.root ?? process.cwd(),
    context.packageJson?.repository?.url,
    context.runGit ?? executeFile,
  );
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
