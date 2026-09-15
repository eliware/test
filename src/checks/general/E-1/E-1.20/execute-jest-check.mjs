import { runJest } from "./run-jest.mjs";
import { runChild } from "./run-child.mjs";

export async function executeJestCheck(context) {
  const startedAt = Date.now();
  let timeoutDiagnostic;
  try {
    const result = context.writeOutput
      ? await runJest(context.root, context.jestArgs ?? [], runChild, {
        onStderr: context.writeOutput,
        onTimeout: (message) => { timeoutDiagnostic = message; },
      })
      : await runJest(context.root, context.jestArgs ?? [], runChild, {});
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
