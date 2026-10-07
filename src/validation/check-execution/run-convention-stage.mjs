import { formatConventionFailure } from "./format-convention-failure.mjs";

function failureCode(result) {
  return Number.isInteger(result.code) ? result.code : 12;
}

export async function runConventionStage(runChecks) {
  try {
    const results = await runChecks();
    const failures = results.filter(({ status }) => status === "fail");
    const diagnostics = failures.map((failure) =>
      failure.stage
        ? `${failure.stage} stage failed: ${failure.message}`
        : formatConventionFailure(failure),
    );
    return {
      code: failures.length > 0 ? Math.max(...failures.map(failureCode)) : 0,
      category: failures.some(({ stage }) => stage) ? "validation" : "conventions",
      diagnostics,
    };
  } catch (error) {
    return {
      code: 1,
      category: "conventions",
      diagnostics: [
        `${error.message}\n  How to resolve: Inspect the reported configuration, path, or check error; correct its cause, then rerun eliware-test.`,
      ],
    };
  }
}
