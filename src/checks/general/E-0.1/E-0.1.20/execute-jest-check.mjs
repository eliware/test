import { runJest } from "./run-jest.mjs";
import { runChild } from "./run-child.mjs";
import { createJestCheckOptions } from "./create-jest-check-options.mjs";

export async function executeJestCheck(context) {
  let startedAt;
  let timeoutDiagnostic;
  try {
    const options = createJestCheckOptions(context, (message) => {
      timeoutDiagnostic = message;
    });
    options.onStart = () => {
      startedAt = Date.now();
    };
    startedAt = Date.now();
    const result = await runJest(context.root, context.jestArgs ?? [], runChild, options);
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
