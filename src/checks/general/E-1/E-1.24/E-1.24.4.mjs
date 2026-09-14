import { fail, pass } from "../../../check-result.mjs";
import { workflowCommands } from "./read-workflows.mjs";
import { readWorkflows } from "./read-workflow-files.mjs";
import { findPublicationCommand, findUnsupportedCommands } from "./classify-workflow-commands.mjs";
import { validateWorkflowSequence } from "./validate-workflow-sequence.mjs";

export const ruleId = "E-1.24.4";
export const parentRuleId = "E-1.24";

export async function run({ root }) {
  for (const { name, document } of await readWorkflows(root)) {
    const commands = workflowCommands(document);
    const publicationWorkflow = /publish|release|deploy/iu.test(name);
    if (findPublicationCommand(commands)) {
      return fail(
        ruleId,
        `${name} contains a publication, deployment, or synchronization command.`,
      );
    }
    if (!publicationWorkflow) {
      const unsupported = findUnsupportedCommands(commands);
      if (unsupported.length > 0)
        return fail(
          ruleId,
          `${name} contains non-validation command(s): ${unsupported.join(", ")}.`,
        );
      const sequenceError = validateWorkflowSequence(name, commands);
      if (sequenceError) return fail(ruleId, sequenceError);
    }
  }
  return pass(ruleId);
}
