import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const prepareConsumerCoverageDirectory = jest.fn();
const createJestProcessOptions = jest.fn();
const buildJestArguments = jest.fn();
const resolveFocusedCoverage = jest.fn();
const validateFocusedTestPath = jest.fn();
const resolveJestReporters = jest.fn();

jest.unstable_mockModule(
  "../../../../../src/validation/stages/jest/configuration/prepare-consumer-coverage-directory.mjs",
  () => ({
    prepareConsumerCoverageDirectory,
  }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/shared/process/create/jest-process-options.mjs",
  () => ({
    createJestProcessOptions,
  }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/jest/configuration/build-jest-arguments.mjs",
  () => ({
    buildJestArguments,
  }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/jest/configuration/resolve/focused-coverage.mjs",
  () => ({
    resolveFocusedCoverage,
  }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/jest/configuration/validate-focused-test-path.mjs",
  () => ({
    validateFocusedTestPath,
  }),
);
jest.unstable_mockModule(
  "../../../../../src/validation/stages/jest/configuration/resolve/jest/reporters.mjs",
  () => ({
    resolveJestReporters,
  }),
);

const { prepareJestRun } =
  await import("../../../../../src/validation/stages/jest/execution/prepare-jest-run.mjs");

beforeEach(() => {
  prepareConsumerCoverageDirectory.mockReset().mockResolvedValue("repo/coverage");
  createJestProcessOptions.mockReset().mockReturnValue({ env: {} });
  buildJestArguments.mockReset().mockReturnValue(["--runInBand"]);
  resolveFocusedCoverage.mockReset().mockResolvedValue([]);
  validateFocusedTestPath.mockReset().mockResolvedValue(undefined);
  resolveJestReporters.mockReset().mockResolvedValue(["default"]);
});

test("builds arguments and stores reports under the consumer coverage directory", async () => {
  const coverageFs = { removeOldReports: true };
  const prepared = await prepareJestRun("repo", [], () => "consumer-jest", { coverageFs });
  expect(prepared.command).toBe(process.execPath);
  expect(prepared.args).toEqual([
    "consumer-jest",
    "--runInBand",
    "--no-color",
    "--coverageReporters=json",
    "--coverageReporters=json-summary",
    "--coverageReporters=text",
    "--coverageDirectory",
    "repo/coverage",
    "--reporters",
    "default",
  ]);
  expect(prepared.coverageDirectory).toBe("repo/coverage");
  expect(prepared.consoleOutputFile).toBe(join("repo", "coverage", "jest-console-output.json"));
  expect(prepared.consoleReportFile).toBe(join("repo", "coverage", "jest-console-events.json"));
  expect(prepareConsumerCoverageDirectory).toHaveBeenCalledWith("repo", coverageFs);
  expect(createJestProcessOptions).toHaveBeenCalledWith("repo", [], {
    coverageFs,
    consoleReportFile: join("repo", "coverage", "jest-console-events.json"),
  });
});

test("adds focused coverage paths and supports omitted arguments or options", async () => {
  validateFocusedTestPath.mockResolvedValue("tests/example.test.mjs");
  resolveFocusedCoverage.mockResolvedValue(["--collectCoverageFrom", "src/example.mjs"]);
  buildJestArguments.mockReturnValue(["--runTestsByPath", "tests/example.test.mjs"]);
  const prepared = await prepareJestRun("repo", undefined, () => "consumer-jest");
  expect(prepared.args).toContain("--runTestsByPath");
  expect(prepared.args).toContain("--collectCoverageFrom");
  expect(prepared.args).toContain("src/example.mjs");
  expect(prepareConsumerCoverageDirectory).toHaveBeenCalledWith("repo", undefined);
  expect(createJestProcessOptions).toHaveBeenCalledWith("repo", [], {
    consoleReportFile: join("repo", "coverage", "jest-console-events.json"),
  });
});
