import { afterEach, expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareJestRun } from "../../../../../src/validation/stages/jest/execution/prepare-jest-run.mjs";

const roots = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), "eliware-jest-prepare-"));
  roots.push(root);
  await writeFile(join(root, "package.json"), JSON.stringify({ jest: { reporters: [] } }));
  return root;
}

test("sets the consumer coverage path and clears old files before Jest runs", async () => {
  const root = await createRoot();
  const coverage = join(root, "coverage");
  await mkdir(coverage);
  await writeFile(join(coverage, "old-report.json"), "old");

  const prepared = await prepareJestRun(root, [], () => "consumer-jest");

  expect(prepared.command).toBe(process.execPath);
  expect(prepared.args[0]).toBe("consumer-jest");
  expect(prepared.args).toContain("--no-color");
  expect(prepared.args).toContain("--coverageReporters=json");
  expect(prepared.args).not.toContain("--json");
  expect(prepared.args).not.toContain("--outputFile");
  const coverageOption = prepared.args.indexOf("--coverageDirectory");
  expect(prepared.args[coverageOption + 1]).toBe(coverage);
  expect(prepared.coverageDirectory).toBe(coverage);
  expect(prepared.consoleOutputFile).toBe(join(coverage, "jest-console-output.json"));
  expect(prepared.consoleReportFile).toBe(join(coverage, "jest-console-events.json"));
  expect(prepared.options).toEqual(expect.objectContaining({ env: expect.any(Object) }));
  await expect(readFile(join(coverage, "old-report.json"), "utf8")).rejects.toMatchObject({
    code: "ENOENT",
  });
});

test("supports an omitted options object", async () => {
  const prepared = await prepareJestRun(await createRoot(), undefined, () => "consumer-jest");
  expect(prepared.args[0]).toBe("consumer-jest");
  expect(prepared.coverageDirectory).toContain("coverage");
});

test("uses the consumer coverage directory for focused test runs", async () => {
  const root = await createRoot();
  await mkdir(join(root, "tests"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "tests", "example.test.mjs"), "");
  await writeFile(join(root, "src", "example.mjs"), "");

  const prepared = await prepareJestRun(root, ["tests/example.test.mjs"], () => "consumer-jest");

  expect(prepared.args).toContain("--runTestsByPath");
  expect(prepared.args).toContain("tests/example.test.mjs");
  expect(prepared.args).toContain("--collectCoverageFrom");
  expect(prepared.args).toContain("src/example.mjs");
  expect(prepared.coverageDirectory).toBe(join(root, "coverage"));
});
