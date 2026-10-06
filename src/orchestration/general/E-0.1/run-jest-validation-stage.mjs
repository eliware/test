import { collectRedactionSecrets } from "../../collect-redaction-secrets.mjs";
import { findUnexpectedJestOutput } from "./E-0.1.20/inspect-jest-output.mjs";

export async function runJestValidationStage(context, runJest) {
  const value = await runJest(context, "stage:jest");
  const outputText = [context.jestResult?.stdout, context.jestResult?.stderr, value.message]
    .filter(Boolean)
    .join("\n");
  const coverageFailure = /coverage threshold.*not met/iu.test(outputText);
  const code =
    value.status === "pass"
      ? 0
      : /could not be started/i.test(value.message)
        ? 1
        : coverageFailure
          ? 4
          : 2;
  const result = {
    ...value,
    stage: "jest",
    code,
    output: context.jestResult,
  };
  if (code !== 0) return result;

  const findings = findUnexpectedJestOutput(
    context.jestResult,
    collectRedactionSecrets(context.env ?? process.env),
    context.root,
  );
  if (findings.length === 0) return result;
  return {
    ...result,
    code: 3,
    status: "fail",
    message: `Unexpected test-process output detected: ${findings.join(" | ")}`,
  };
}
