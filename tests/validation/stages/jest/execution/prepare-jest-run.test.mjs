import { afterEach, expect, test } from "@jest/globals";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import { prepareJestRun } from "../../../../../src/validation/stages/jest/execution/prepare-jest-run.mjs";

const temporaryCoverageDirectories = [];
afterEach(async () => {
  await Promise.all(
    temporaryCoverageDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

test("coordinates Jest preparation into one executable process request", async () => {
  const prepared = await prepareJestRun(process.cwd(), [], () => "consumer-jest");
  temporaryCoverageDirectories.push(prepared.coverageDirectory);

  expect(prepared.command).toBe(process.execPath);
  expect(prepared.args[0]).toBe("consumer-jest");
  expect(prepared.args).toContain("--no-color");
  expect(prepared.args).toContain("--coverageReporters=json");
  expect(prepared.args).not.toContain("--json");
  expect(prepared.args).not.toContain("--outputFile");
  const coverageDirectoryOption = prepared.args.indexOf("--coverageDirectory");
  expect(coverageDirectoryOption).toBeGreaterThan(-1);
  expect(prepared.args[coverageDirectoryOption + 1]).toBe(prepared.coverageDirectory);
  expect(prepared.coverageDirectory).toContain("eliware-test");
  expect(prepared.coverageDirectory).not.toContain("node_modules");
  expect(prepared.options).toEqual(expect.objectContaining({ env: expect.any(Object) }));
});

test("uses an injected run-scoped coverage directory", async () => {
  const createCoverageDirectory = () => "C:/run/coverage";
  const prepared = await prepareJestRun(process.cwd(), [], () => "consumer-jest", {
    createCoverageDirectory,
  });

  expect(prepared.coverageDirectory).toBe("C:/run/coverage");
  expect(prepared.args).toContain("C:/run/coverage");
  expect(prepared.consoleReportFile).toBe(join("C:/run/coverage", "jest-console-output.json"));
});

test("falls back when the injected coverage-directory factory has no result", async () => {
  const prepared = await prepareJestRun(process.cwd(), [], () => "consumer-jest", {
    createCoverageDirectory: () => undefined,
  });
  temporaryCoverageDirectories.push(prepared.coverageDirectory);

  expect(prepared.coverageDirectory).toContain("eliware-test");
});

test("supports an omitted options object", async () => {
  const prepared = await prepareJestRun(process.cwd(), undefined, () => "consumer-jest");
  temporaryCoverageDirectories.push(prepared.coverageDirectory);

  expect(prepared.args[0]).toBe("consumer-jest");
  expect(prepared.coverageDirectory).toContain("eliware-test");
});
