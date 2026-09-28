import { findWorkflowValidationJobs } from "../../E-0.1.24/find-workflow-validation-jobs.mjs";

export function findMissingCiCapabilityStages(required, workflows) {
  const commands = workflows.flatMap(({ document }) =>
    findWorkflowValidationJobs(document)
      .filter(
        ({ job, commands: steps }) =>
          /^ubuntu(?:-|$)/iu.test(String(job["runs-on"] ?? "")) &&
          steps.some(
            ({ command }, index) =>
              /^npm\s+ci$/iu.test(command) &&
              /^npm\s+test$/iu.test(steps[index + 1]?.command ?? ""),
          ),
      )
      .flatMap(({ commands: steps }) => steps.map(({ command }) => command)),
  );
  return required.filter(
    (name) =>
      !commands.some((command) =>
        new RegExp(`^npm\\s+run\\s+${name}(?:\\s|$)`, "iu").test(command),
      ),
  );
}
