import { fail, pass } from "../../../check-result.mjs";
import { workflowCommands } from "./read-workflows.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";

export const ruleId = "A-1.24.0";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  for (const { name, document } of await readWorkflows(root)) {
    const commands = workflowCommands(document);
    const install = commands.findIndex(({ command }) => /^npm\s+ci(?:\s|$)/u.test(command));
    const test = commands.findIndex(({ command }) => /^npm\s+test(?:\s|$)/u.test(command));
    if (install < 0 || test < 0 || install > test)
      return fail(ruleId, `${name} must run npm ci followed by npm test.`);
  }
  return pass(ruleId);
}
