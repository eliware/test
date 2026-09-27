export function validateNpmOidcPermissionScope(workflow, publicationJobs, validationJobs) {
  const workflowPermissions = workflow.document?.permissions ?? {};
  if (workflowPermissions === "write-all" || workflowPermissions["id-token"] === "write")
    return "id-token: write must be scoped to the npm publication job.";
  if (validationJobs.some(({ job }) => job.permissions?.["id-token"] === "write"))
    return "npm validation jobs must not receive id-token: write.";
  if (publicationJobs.some(({ job }) => job.permissions?.["id-token"] !== "write"))
    return "The npm publication job must explicitly grant id-token: write.";
  if (/\b(?:NPM_TOKEN|NPM_AUTH_TOKEN|NODE_AUTH_TOKEN)\b|_authToken/iu.test(JSON.stringify(workflow.document)))
    return "npm Trusted Publishing workflows must not configure static npm authentication.";
  return null;
}
