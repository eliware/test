export function permissions(workflow, job) {
  return job?.permissions ?? workflow.document?.permissions ?? {};
}
