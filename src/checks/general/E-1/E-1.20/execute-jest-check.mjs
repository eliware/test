import { runJest } from "./run-jest.mjs";

export async function executeJestCheck(context) {
  const startedAt = Date.now();
  let timeoutDiagnostic;
  try {
    const result = context.writeOutput
      ? await runJest(context.root, context.jestArgs ?? [], undefined, {
        onStderr: context.writeOutput,
        onTimeout: (message) => { timeoutDiagnostic = message; },
      })
      : await runJest(context.root, context.jestArgs ?? []);
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
