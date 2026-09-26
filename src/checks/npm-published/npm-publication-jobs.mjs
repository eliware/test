import { jobs, steps } from "../ghcr-published/workflow-structure.mjs";

export function npmPublicationJobs(workflow) {
  return jobs(workflow).filter(({ job }) =>
    steps(job).some((step) => /\bnpm\s+publish\b/i.test(String(step.run ?? ""))),
  );
}
