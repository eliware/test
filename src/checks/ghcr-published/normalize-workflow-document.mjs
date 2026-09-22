export function normalizeWorkflowDocument(document) {
  if (!document || typeof document !== "object") return document;
  const trigger = document.on ?? document.true;
  const jobs = Object.fromEntries(Object.entries(document.jobs ?? {}).map(([id, job]) => [id, normalizeWorkflowJob(job)]));
  return { ...document, on: trigger, jobs };
}

export function normalizeWorkflowJob(job) {
  if (!job || typeof job !== "object") return job;
  const runner = job["runs-on"] ?? job.runsOn;
  return {
    ...job,
    ...(runner === undefined ? {} : { "runs-on": runner }),
    steps: Array.isArray(job.steps) ? job.steps.map(normalizeWorkflowStep) : job.steps,
  };
}

function normalizeWorkflowStep(step) {
  if (!step || typeof step !== "object") return step;
  const withValues = step.with;
  if (!withValues || typeof withValues !== "object") return step;
  return {
    ...step,
    with: {
      ...withValues,
      ...(withValues.subjectName === undefined && withValues["subject-name"] !== undefined ? { subjectName: withValues["subject-name"] } : {}),
      ...(withValues.subjectDigest === undefined && withValues["subject-digest"] !== undefined ? { subjectDigest: withValues["subject-digest"] } : {}),
      ...(withValues.pushToRegistry === undefined && withValues["push-to-registry"] !== undefined ? { pushToRegistry: withValues["push-to-registry"] } : {}),
    },
  };
}
