import { access } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.6";
export const parentRuleId = "E-1.160";

export function isOwnedBuildStep(step) {
  if (/docker\/build-push-action/i.test(step.uses ?? "")) {
    const context = String(step.with?.context ?? ".").trim();
    const file = String(step.with?.file ?? "./Dockerfile").trim();
    return (context === "." || context === "./") && (file === "Dockerfile" || file === "./Dockerfile");
  }
  if (typeof step.run !== "string") return false;
  const command = step.run.trim();
  if (!/^docker\s+build(?:\s|$)/iu.test(command) || !/(?:^|\s)\.$/u.test(command)) return false;
  const file = command.match(/(?:^|\s)-f\s+([^\s;&|]+)/iu)?.[1];
  return !file || file === "Dockerfile" || file === "./Dockerfile";
}

export async function run({ root }) {
  try {
    await access(join(root, "Dockerfile"));
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    if (
      !publication ||
      !publicationJobs(publication).some(({ job }) =>
        steps(job).some(
          (step) =>
            isOwnedBuildStep(step),
        ),
      )
    )
      return fail(
        ruleId,
        "GHCR repositories must build their owned Dockerfile in a publication workflow.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR build definition could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
