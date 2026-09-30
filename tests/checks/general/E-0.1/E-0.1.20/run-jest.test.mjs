import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { runJest } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-jest.mjs";
import { resolveSharedJestCli } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-jest-cli.mjs";
import { runChild } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-child.mjs";
import { findUnexpectedJestOutput } from "../../../../../src/checks/general/E-0.1/E-0.1.20/inspect-jest-output.mjs";

test("coordinates prepared command execution and returns the executor result", async () => {
  const execute = jest.fn(async () => ({ code: 0, stdout: "passed", stderr: "" }));
  const result = await runJest(process.cwd(), [], execute, { jestCli: "jest-cli" });
  expect(execute).toHaveBeenCalledTimes(1);
  expect(result).toMatchObject({ code: 0, stdout: "passed" });
  expect(result.reportError).toMatch("Could not read Jest's structured result report");
  expect(result.coverageDirectory).toBeUndefined();
});

test("does not read structured reports after a failed Jest process", async () => {
  const readReport = jest.fn();
  const result = await runJest(
    process.cwd(),
    [],
    async () => ({ code: 1, stdout: "failed", stderr: "" }),
    { jestCli: "jest-cli", readReport },
  );

  expect(result.code).toBe(1);
  expect(readReport).not.toHaveBeenCalled();
});

test("reports structured report reader errors that are not Error objects", async () => {
  const readReport = jest.fn(() => {
    throw "invalid report";
  });
  const result = await runJest(
    process.cwd(),
    [],
    async () => ({ code: 0, stdout: "passed", stderr: "" }),
    { jestCli: "jest-cli", readReport },
  );

  expect(result.reportError).toContain(
    "Could not read Jest's structured result report: invalid report",
  );
  expect(readReport).toHaveBeenCalledTimes(1);
});

test("reports structured report reader errors with their message", async () => {
  const readReport = jest.fn(() => {
    throw new Error("report unavailable");
  });
  const result = await runJest(
    process.cwd(),
    [],
    async () => ({ code: 0, stdout: "passed", stderr: "" }),
    { jestCli: "jest-cli", readReport },
  );

  expect(result.reportError).toContain(
    "Could not read Jest's structured result report: report unavailable",
  );
});

test("attaches the structured Jest report before retaining successful coverage artifacts", async () => {
  const execute = async (_command, args) => {
    const reportPath = args[args.indexOf("--outputFile") + 1];
    await writeFile(
      reportPath,
      JSON.stringify({ testResults: [{ name: "tests/example.test.mjs" }] }),
    );
    const coverageDirectory = args[args.indexOf("--coverageDirectory") + 1];
    await writeFile(join(coverageDirectory, "jest-console-output.json"), "[]");
    return { code: 0, stdout: "PASS tests/example.test.mjs\n", stderr: "" };
  };
  const result = await runJest(process.cwd(), [], execute, {
    jestCli: "jest-cli",
    retainCoverageDirectory: true,
  });
  try {
    expect(result.report).toEqual({ testResults: [{ name: "tests/example.test.mjs" }] });
    expect(result.reportError).toBeUndefined();
  } finally {
    await rm(result.coverageDirectory, { recursive: true, force: true });
  }
});

test("cleans coverage artifacts when command execution throws", async () => {
  const removeCoverage = jest.fn();
  await expect(
    runJest(
      process.cwd(),
      undefined,
      () => {
        throw new Error("Jest could not start");
      },
      { jestCli: "jest-cli" },
      removeCoverage,
    ),
  ).rejects.toThrow("Jest could not start");
  expect(removeCoverage).toHaveBeenCalledWith(expect.any(String), {
    recursive: true,
    force: true,
  });
});

test("runs bundled Jest from the consumer root and uses its configuration", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-consumer-jest-root-"));
  const suiteDirectory = join(root, "consumer-suites");
  await mkdir(suiteDirectory);
  await writeFile(join(root, "package.json"), JSON.stringify({ name: "consumer-fixture" }));
  await writeFile(
    join(root, "jest.config.cjs"),
    'module.exports = { testMatch: ["<rootDir>/consumer-suites/configured.consumer.test.cjs"], globalSetup: "<rootDir>/mark-consumer-config.cjs" };',
  );
  await writeFile(
    join(root, "mark-consumer-config.cjs"),
    `const fs = require("node:fs"); module.exports = async () => fs.writeFileSync(${JSON.stringify(join(root, "consumer-config-loaded.txt"))}, process.cwd());`,
  );
  await writeFile(
    join(suiteDirectory, "configured.consumer.test.cjs"),
    `test("uses consumer root", () => { console.log("actual consumer test output"); expect(process.cwd()).toBe(${JSON.stringify(root)}); });`,
  );
  try {
    const result = await runJest(root, [], runChild, {
      jestCli: resolveSharedJestCli(),
      env: { ...process.env, CI: "true" },
    });

    expect(result.code).toBe(0);
    expect(findUnexpectedJestOutput(result, [], root)).toEqual([
      expect.stringContaining(
        "console.log in consumer-suites/configured.consumer.test.cjs: actual consumer test output",
      ),
    ]);
    await expect(readFile(join(root, "consumer-config-loaded.txt"), "utf8")).resolves.toBe(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
