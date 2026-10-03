import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { readRepositoryText } from "../../read-repository-text.mjs";
import { readSection } from "../../general/E-0.1/E-0.1.1/read-readme-section.mjs";
import { validateGhcrReadme } from "../validate-ghcr-readme.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";
import { imageTags } from "../find-ghcr-image-push.mjs";

export const ruleId = "E-0.1.160.11";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  try {
    const { root, packageJson } = context;
    const packageName = String(packageJson?.name ?? "").replace(/^@[^/]+\//u, "");
    const image = packageName ? `ghcr.io/eliware/${packageName}` : "";
    const readme = await readRepositoryText(context, join(root, "README.md"));
    const usage = readSection(readme, "Usage");
    const workflows = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    const supportsLatest = workflows.some((workflow) =>
      publicationJobs(workflow).some(({ job }) =>
        steps(job).some(
          (step) =>
            step?.uses === "docker/build-push-action@v6" &&
            step?.with?.push === true &&
            imageTags(step?.with?.tags).some(
              (tag) => tag.toLowerCase() === `${image}:latest`.toLowerCase(),
            ),
        ),
      ),
    );
    const errors = validateGhcrReadme(
      usage,
      image,
      String(packageJson?.version ?? ""),
      supportsLatest,
    );
    return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, `GHCR README could not be inspected: ${error.message}`);
  }
}
