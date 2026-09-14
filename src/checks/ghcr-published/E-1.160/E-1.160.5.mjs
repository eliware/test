import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { permissions } from "../workflow-policy.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { stepText, steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.5";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    const publicationJob = publication && publicationJobs(publication)[0]?.job;
    const jobSteps = publicationJob ? steps(publicationJob) : [];
    const attestIndex = jobSteps.findIndex((step) => step.uses === "actions/attest@v4");
    const pushIndex = jobSteps.findIndex((step) =>
      /docker\/build-push-action|docker\s+push/i.test(stepText(step)),
    );
    const permissionsSet = permissions(publication, publicationJob);
    const attest = attestIndex >= 0 ? jobSteps[attestIndex] : null;
    const attestWith = attest?.with ?? {};
    const subjectName = attestWith.subjectName ?? attestWith["subject-name"];
    const subjectDigest = attestWith.subjectDigest ?? attestWith["subject-digest"];
    if (
      !publication ||
      attestIndex < 0 ||
      pushIndex < 0 ||
      attestIndex <= pushIndex ||
      permissionsSet["id-token"] !== "write" ||
      permissionsSet.attestations !== "write" ||
      permissionsSet["artifact-metadata"] !== "write" ||
      permissionsSet.contents !== "read" ||
      permissionsSet.packages !== "write" ||
      (attestWith.pushToRegistry ?? attestWith["push-to-registry"]) !== true ||
      typeof subjectName !== "string" ||
      typeof subjectDigest !== "string" ||
      subjectName.includes(":${{") ||
      !/digest/i.test(subjectDigest)
    )
      return fail(
        ruleId,
        "GHCR publication must produce a signed artifact attestation with the required permissions.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
