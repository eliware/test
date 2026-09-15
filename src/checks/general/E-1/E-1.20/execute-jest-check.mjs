import { runJest } from "./run-jest.mjs";
import { runChild } from "./run-child.mjs";
import { rm } from "node:fs/promises";
import { join } from "node:path";

export async function executeJestCheck(context) {
  const startedAt = Date.now();
  await Promise.all(["coverage-final.json", "coverage-summary.json", "coverage.json"].map((file) =>
    rm(join(context.root, "coverage", file), { force: true }),
  ));
  let timeoutDiagnostic;
  try {
    const result = await runJest(context.root, context.jestArgs ?? [], runChild, {
      onStderr: context.writeOutput,
      onTimeout: (message) => { timeoutDiagnostic = message; },
    });
    return { result: { ...result, startedAt }, timeoutDiagnostic };
  } catch (error) {
    return { error };
  }
}
