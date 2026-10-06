import { executeAuditProcess } from "./general/E-0.1/E-0.1.20/execute-audit-process.mjs";
import { runNpmAudit } from "./general/E-0.1/E-0.1.20/run-npm-audit.mjs";
import { runChild } from "./general/E-0.1/E-0.1.20/run-child.mjs";
import { runOxlint } from "./general/E-0.1/E-0.1.4/run-oxlint.mjs";
import { runJestStage } from "./general/E-0.1/run-jest-stage.mjs";
import { executeFormatterValidation } from "./general/E-0.1/E-0.1.20/execute-formatter-validation.mjs";
import { runPrettier } from "./run-prettier.mjs";
import { executePackValidation } from "./npm-published/E-0.1.140/execute-pack-validation.mjs";
import { runNpmPack } from "./npm-published/E-0.1.140/run-npm-pack.mjs";

function result(stage, code, message, output) {
  return {
    ruleId: `stage:${stage}`,
    stage,
    code,
    status: code === 0 ? "pass" : "fail",
    message,
    output,
  };
}

export function createValidationStageRunners({
  runJest = runJestStage,
  runLint = runOxlint,
  runFormatter = runPrettier,
  runAudit = runNpmAudit,
  runAuditChild = runChild,
  validateFormatter = executeFormatterValidation,
  validatePack = executePackValidation,
  runPack = runNpmPack,
} = {}) {
  return {
    jest: async (context) => {
      const value = await runJest(context, "stage:jest");
      return {
        ...value,
        stage: "jest",
        code: value.status === "pass" ? 0 : /could not be started/i.test(value.message) ? 14 : 8,
        output: context.jestResult,
      };
    },
    lint: async (context) => {
      try {
        const value = await runLint(
          context.root,
          undefined,
          undefined,
          context.toolArgs,
          context.focusedScope?.paths ?? [],
        );
        return result(
          "lint",
          value.code === 0 ? 0 : 12,
          [value.stdout, value.stderr].filter(Boolean).join("\n"),
          value,
        );
      } catch (error) {
        return result("lint", 14, error.message);
      }
    },
    format: async (context) => {
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
      return result("format", message ? 18 : 0, message ?? "", { message, output });
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
        return result(
          "audit",
          value.code === 0 ? 0 : 17,
          value.code === 0 ? "" : "npm audit failed.",
          value,
        );
      } catch (error) {
        return result("audit", 14, error.message);
      }
    },
    pack: async (context) => {
      if (!context.packageJson?.eliware?.apply?.includes("npm-published"))
        return result("pack", 0, "Package validation does not apply.");
      let output;
      const message = await validatePack({
        root: context.root,
        packageJson: context.packageJson,
        executePack: context.executePack,
        mode: context.mode,
        runPack: async (...args) => {
          output = await runPack(...args);
          return output;
        },
        toolArgs: context.toolArgs,
      });
      return result("pack", message ? 17 : 0, message ?? "", { message, output });
    },
  };
}
