import { runJest } from "./run-jest.mjs";
import { runChild } from "./run-child.mjs";

export async function executeJestCheck(context) {
  const startedAt = Date.now();
  let timeoutDiagnostic;
  try {
    const result = await runJest(context.root, context.jestArgs ?? [], runChild, {
      onStderr: context.writeOutput,
      onTimeout: (message) => {
        timeoutDiagnostic = message;
      },
      retainCoverageDirectory: true,
      env: context.env ?? process.env,
    });
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
