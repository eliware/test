export function collectValues(value, key, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectValues(item, key, output));
  } else if (value && typeof value === "object") {
    for (const [name, child] of Object.entries(value)) {
      if (name === key) output.push(child);
      collectValues(child, key, output);
    }
  }
  return output;
}

export function workflowJobs(document) {
  if (!document?.jobs || typeof document.jobs !== "object" || Array.isArray(document.jobs)) return [];
  return Object.entries(document.jobs).map(([id, job]) => ({ id, job })).filter(({ job }) => job && typeof job === "object");
}

export function workflowRunSteps(job) {
  if (!Array.isArray(job?.steps)) return [];
  return job.steps
    .filter((step) => step && typeof step === "object" && typeof step.run === "string")
    .map((step) => ({ name: step.name, command: step.run.trim() }));
}

export function workflowCommands(document) {
  return workflowJobs(document).flatMap(({ id, job }) =>
    workflowRunSteps(job).map((step) => ({ job: id, ...step })),
  );
}

export function isValidationJob(id, job) {
  const label = `${id} ${job?.name ?? ""}`;
  return /(?:^|\b)(?:ci|check|test|validate|validation)(?:\b|$)/iu.test(label);
}
