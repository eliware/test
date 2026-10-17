export function validateCiWorkflowJob(document) {
  const errors = [];
  const jobNames = Object.keys(document.jobs ?? {});
  if (jobNames.some((name) => name !== "test"))
    errors.push("ci.yaml must use `test` for the only validation job key.");
  const jobs = Object.values(document.jobs ?? {});
  if (jobs.length !== 1) errors.push("ci.yaml must define one validation job.");
  const job = jobs.find((item) => Array.isArray(item?.steps));
  if (!job) return { errors: [...errors, "ci.yaml must define a validation job with steps."] };
  rejectUnknownKeys(job, ["runs-on", "permissions", "steps"], "validation job", errors);
  if (!/^ubuntu(?:-|$)/iu.test(String(job["runs-on"] ?? "")))
    errors.push("ci.yaml validation job must run on Ubuntu.");
  if (job.if !== undefined || job["continue-on-error"] !== undefined)
    errors.push("ci.yaml validation job must run unconditionally without continue-on-error.");
  return { job, errors };
}

function rejectUnknownKeys(value, allowed, label, errors) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) errors.push(`ci.yaml ${label} has unsupported keys: ${unknown.join(", ")}.`);
}
