import { runJest } from "./run-jest.mjs";
import { runChild } from "./run-child.mjs";
import { rm } from "node:fs/promises";
import { join } from "node:path";

export async function executeJestCheck(context) {
  const startedAt = Date.now();
  await Promise.all([
    join(context.root, "coverage", "coverage-final.json"),
    join(context.root, "coverage", "coverage-summary.json"),
    join(context.root, "coverage", "coverage.json"),
    join(context.root, "coverage.json"),
  ].map((file) => rm(file, { force: true })));
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
