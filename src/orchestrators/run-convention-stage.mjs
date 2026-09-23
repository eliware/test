import { formatConventionFailure } from "./convention-remediation.mjs";

function failureCode({ ruleId, message = "" }) {
  if (ruleId === "E-1.20.10") return 10;
  if (ruleId === "E-1.4") return /could not be started/i.test(message) ? 14 : 12;
  if (ruleId === "E-1.20") {
    if (/focused test path|unsupported focused path|ambiguous focused path/i.test(message))
      return 18;
    return /could not be started/i.test(message) ? 14 : 8;
  }
  if (/^E-1\.140(?:\.|$)/.test(ruleId) || /^E-1\.20\.(?:12|13|14|19)$/.test(ruleId)) return 17;
  return 18;
}

export async function runConventionStage(runChecks) {
  try {
    const results = await runChecks();
    const failures = results.filter(({ status }) => status === "fail");
    const diagnostics = failures.map((failure) => formatConventionFailure(failure));
    return {
      code: failures.length > 0 ? Math.max(...failures.map(failureCode)) : 0,
      category: "conventions",
      diagnostics,
    };
  } catch (error) {
    return {
      code: 18,
      category: "conventions",
      diagnostics: [
        `${error.message}\n  How to resolve: Inspect the reported configuration, path, or check error; correct its cause, then rerun eliware-test.`,
      ],
    };
  }
}
