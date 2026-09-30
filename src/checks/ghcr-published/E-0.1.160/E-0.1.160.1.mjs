import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";

export const ruleId = "E-0.1.160.1";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root, packageJson } = context;
  try {
    const repository = String(packageJson?.name ?? "").replace(/^@[^/]+\//, "");
    if (!repository) return fail(ruleId, "Package name is required to determine the GHCR image.");
    const image = `ghcr.io/eliware/${repository}`;
    const workflows = await readWorkflows(root, context);
    const names = workflows
      .filter(isPublicationWorkflow)
      .flatMap(publicationJobs)
      .flatMap(({ job }) => steps(job))
      .filter((step) => step.uses === "docker/build-push-action@v6" && step.with?.push === true)
      .flatMap((step) => String(step.with?.tags ?? "").split(/\r?\n/u))
      .map((tag) => tag.trim().match(/^(ghcr\.io\/[^\s:]+)(?::[^\s]+)?$/u)?.[1])
      .filter(Boolean);
    if (
      names.length === 0 ||
      new Set(names).size !== 1 ||
      names[0].toLowerCase() !== image.toLowerCase()
    )
      return fail(ruleId, `GHCR publication must push exactly one image: ${image}.`);
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
