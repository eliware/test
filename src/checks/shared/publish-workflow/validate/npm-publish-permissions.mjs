export function validateNpmPublishPermissions(workflow, path = "specs/workflows/npm.yaml") {
  const errors = [];
  const jobs = workflow?.jobs;

  if (workflow?.permissions?.["id-token"] === "write") {
    errors.push(`${path} must not grant id-token: write at the workflow level.`);
  }
  if (jobs?.publish?.permissions?.["id-token"] !== "write") {
    errors.push(`${path} publish job must grant id-token: write.`);
  }
  for (const [name, job] of Object.entries(jobs ?? {})) {
    if (name !== "publish" && job?.permissions?.["id-token"] === "write") {
      errors.push(`${path} ${name} job must not grant id-token: write.`);
    }
  }
  return errors;
}
