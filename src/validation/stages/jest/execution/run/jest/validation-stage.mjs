import { collectRedactionSecrets } from "../../../../../shared/output/redaction/collect-redaction-secrets.mjs";
import { findUnexpectedJestOutput } from "../../../progress/inspect-jest-output.mjs";
import { formatJestCoverageFailure } from "../../../progress/format-jest-coverage-failure.mjs";
import { getJestStageFailureCode } from "./failure-code.mjs";

export async function runJestValidationStage(context, runJest, readCoverage) {
  const jestStartedAt = Date.now();
  const value = await runJest(context, "stage:jest");
  const outputText = [context.jestResult?.stdout, context.jestResult?.stderr, value.message]
    .filter(Boolean)
    .join("\n");
  const code = getJestStageFailureCode(value, outputText);
  const result = {
    ...value,
    stage: "jest",
    code,
    output: context.jestResult,
  };
  if (code === 4) {
    const details = await formatJestCoverageFailure(context.jestResult, context.root, readCoverage);
    return { ...result, message: `${value.message}\n${details}` };
  }
  if (code !== 0) return result;

  const jestCounts = readJestCounts(outputText);
  if (!jestCounts?.testSuites || !jestCounts.tests)
    return {
      ...result,
      code: 2,
      status: "fail",
      message: "Jest completed without running at least one test in one suite.",
    };

  if (context.validationSummary) {
    context.validationSummary.jestTimeMs =
      Date.now() - (context.jestResult?.startedAt ?? jestStartedAt);
    context.validationSummary.jestCounts = jestCounts;
  }

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

function readJestCounts(text) {
  for (const line of text.split(/\r?\n/u)) {
    const match = line.match(/^\[eliware-test-progress\] (.+)$/u);
    if (!match) continue;
    try {
      const event = JSON.parse(match[1]);
      if (event.event === "run-complete")
        return { testSuites: event.testSuites, tests: event.tests };
    } catch {
      continue;
    }
  }
  return null;
}
