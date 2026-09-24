import { jobs, steps } from "./workflow-structure.mjs";

export function findValidationJobs(workflow) {
  return jobs(workflow).filter(
    ({ job }) =>
      steps(job).some((step) => /^npm\s+ci$/iu.test(String(step.run ?? "").trim())) &&
      steps(job).some((step) => /^npm\s+test$/iu.test(String(step.run ?? "").trim())),
  );
}
