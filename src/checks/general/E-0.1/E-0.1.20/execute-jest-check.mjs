import { runJest } from "./run-jest.mjs";
import { runChild } from "./run-child.mjs";
import { createJestCheckOptions } from "./create-jest-check-options.mjs";

export async function executeJestCheck(context) {
  const startedAt = Date.now();
  let timeoutDiagnostic;
  try {
    const result = await runJest(
      context.root,
      context.jestArgs ?? [],
      runChild,
      createJestCheckOptions(context, (message) => {
        timeoutDiagnostic = message;
      }),
    );
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
