import { hasNpmStaticCredentials } from "./has-npm-static-credentials.mjs";
import { hasReadOnlyWorkflowPermissions } from "../../ghcr-published/expected-publication-permissions.mjs";

export function validateNpmOidcPermissionScope(workflow, publicationJobs, validationJobs) {
  const failures = [];
  const workflowPermissions = workflow.document?.permissions ?? {};
  if (!hasReadOnlyWorkflowPermissions(workflowPermissions))
    failures.push(
      "id-token: write must be scoped to the npm publication job, and workflow-level permissions must be exactly contents: read.",
    );
  const validationTokenJobs = validationJobs
    .filter(({ job }) => job.permissions?.["id-token"] === "write")
    .map(({ id }) => id);
  if (validationTokenJobs.length)
    failures.push(
      `npm validation jobs must not receive id-token: write: ${validationTokenJobs.join(", ")}.`,
    );
  const unscopedPublicationJobs = publicationJobs
    .filter(({ job }) => job.permissions?.["id-token"] !== "write")
    .map(({ id }) => id);
  if (unscopedPublicationJobs.length)
    failures.push(
      `npm publication jobs must explicitly grant id-token: write: ${unscopedPublicationJobs.join(", ")}.`,
    );
  if (hasNpmStaticCredentials(workflow.document))
    failures.push("npm Trusted Publishing workflows must not configure static npm authentication.");
  return failures.length ? failures.join("\n") : null;
}
