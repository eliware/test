import isSafeReportingCommand from "../is-safe-reporting-command.mjs";
import validateNpmRunCommand from "../../../../package-scripts/validate/npm-run-command.mjs";
import hasDuplicateAggregateStage from "../../../has/duplicate-aggregate-stage.mjs";

export default function validatePostTestSteps(steps, test, packageJson) {
  const errors = [];
  if (test < 0) return errors;
  for (const step of steps.slice(test + 1)) {
    if (typeof step?.run !== "string") {
      errors.push(
        "ci.yaml validation step after npm test must call a declared package script with npm run <name>.",
      );
      continue;
    }
    if (isSafeReportingCommand(step.run)) continue;
    if (hasDuplicateAggregateStage(step.run)) {
      errors.push("ci.yaml must not repeat an aggregate validation stage after npm test.");
      continue;
    }
    errors.push(
      ...validateNpmRunCommand(step.run, packageJson, "ci.yaml validation step after npm test"),
    );
  }
  return errors;
}
