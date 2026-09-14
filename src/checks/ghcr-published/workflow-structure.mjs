export function jobs(workflow) {
  return Object.entries(workflow?.document?.jobs ?? {}).map(([id, job]) => ({ id, job }));
}

export function steps(job) {
  return Array.isArray(job?.steps) ? job.steps : [];
}

export function stepText(step) {
  return [step?.run, step?.uses, step?.with?.tags, step?.with?.subjectName, step?.with?.subjectDigest]
    .filter((value) => typeof value === "string")
    .join(" ");
}

export function stepsForWorkflow(workflow) {
  return jobs(workflow).flatMap(({ job }) => steps(job));
}

export function workflowText(workflow) {
  return stepsForWorkflow(workflow).map(stepText).concat(workflow.content).join("\n");
}
