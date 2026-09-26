import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { prepareJestRun } from "../../../../../src/checks/general/E-0.1/E-0.1.20/prepare-jest-run.mjs";

test("prepares a Jest command and runtime options through injected resolution", async () => {
  const prepared = await prepareJestRun(
    process.cwd(),
    [],
    (_root, options) => options.jestCli,
    { jestCli: "consumer-jest" },
  );
  expect(prepared.command).toBe(process.execPath);
  expect(prepared.args[0]).toBe("consumer-jest");
  expect(prepared.args).toContain("--coverageReporters=json");
  expect(prepared.args).toContain("--coverageDirectory");
  expect(prepared.coverageDirectory).toContain("eliware-test");
  expect(prepared.coverageDirectory).not.toContain("node_modules");
  expect(prepared.options).toEqual(expect.objectContaining({ env: expect.any(Object) }));
});

test("uses default arguments and timing reporter configuration", async () => {
  const prepared = await prepareJestRun(
    process.cwd(),
    undefined,
    () => "consumer-jest",
    {},
  );
  expect(prepared.args).toContain("--runInBand");
});

test("preserves configured package reporters with the harness reporters", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-reporters-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ jest: { reporters: ["summary"] } }));
    const prepared = await prepareJestRun(root, ["--debug-timing"], () => "jest-cli", {});
    expect(prepared.args).toContain("summary");
    expect(prepared.args).toContain("default");
    expect(prepared.args.some((argument) => argument.endsWith("jest-timing-reporter.mjs"))).toBe(true);
    expect(prepared.args.filter((argument) => argument === "--reporters")).toHaveLength(4);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects package reporters with options that cannot be forwarded by the CLI", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-reporters-options-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ jest: { reporters: [["summary", {}]] } }));
    await expect(prepareJestRun(root, [], () => "jest-cli", {})).rejects.toThrow("per-reporter options");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
