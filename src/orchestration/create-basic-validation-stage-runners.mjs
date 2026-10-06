import { executeAuditProcess } from "./general/E-0.1/E-0.1.20/execute-audit-process.mjs";
import { runNpmAudit } from "./general/E-0.1/E-0.1.20/run-npm-audit.mjs";
import { runChild } from "./general/E-0.1/E-0.1.20/run-child.mjs";
import { runOxlint } from "./general/E-0.1/E-0.1.4/run-oxlint.mjs";
import { runJestStage } from "./general/E-0.1/run-jest-stage.mjs";
import { runJestValidationStage } from "./general/E-0.1/run-jest-validation-stage.mjs";
import { executeFormatterValidation } from "./general/E-0.1/E-0.1.20/execute-formatter-validation.mjs";
import { runPrettier } from "./run-prettier.mjs";
import { createValidationStageResult } from "./create-validation-stage-result.mjs";

export function createBasicValidationStageRunners({
  runJest = runJestStage,
  runLint = runOxlint,
  runFormatter = runPrettier,
  runAudit = runNpmAudit,
  runAuditChild = runChild,
  validateFormatter = executeFormatterValidation,
} = {}) {
  return {
    jest: async (context) => runJestValidationStage(context, runJest),
    lint: async (context) => {
      try {
        const value = await runLint(
          context.root,
          undefined,
          undefined,
          context.toolArgs,
          context.focusedScope?.paths ?? [],
        );
        const message = [value.stdout, value.stderr].filter(Boolean).join("\n");
        return createValidationStageResult("lint", value.code === 0 ? 0 : 5, message, value);
      } catch (error) {
        return createValidationStageResult("lint", 5, error.message);
      }
    },
    format: async (context) => {
      try {
        let output;
        const message = await validateFormatter({
          root: context.root,
          executeFormat: context.executeFormat,
          mode: context.mode,
          runFormatter: async (...args) => {
            output = await runFormatter(...args);
            return output;
          },
          toolArgs: context.toolArgs,
          focusedScope: context.focusedScope,
          env: context.env ?? process.env,
        });
        return createValidationStageResult("format", message ? 6 : 0, message ?? "", {
          message,
          output,
        });
      } catch (error) {
        return createValidationStageResult("format", 6, error.message);
      }
    },
    audit: async (context) => {
      try {
        const value = await executeAuditProcess({
          root: context.root,
          runAudit,
          runChild: runAuditChild,
          toolArgs: context.toolArgs,
          env: context.env ?? process.env,
        });
        return createValidationStageResult(
          "audit",
          value.code === 0 ? 0 : 7,
          value.code === 0 ? "" : "npm audit failed.",
          value,
        );
      } catch (error) {
        return createValidationStageResult("audit", 7, error.message);
      }
    },
  };
}
