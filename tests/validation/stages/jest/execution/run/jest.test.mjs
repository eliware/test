import { afterEach, expect, jest, test } from "@jest/globals";
import { lstat, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runJest } from "../../../../../../src/validation/stages/jest/execution/run/jest.mjs";
import { findUnexpectedJestOutput } from "../../../../../../src/validation/stages/jest/progress/inspect-jest-output.mjs";

const roots = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), "eliware-consumer-jest-root-"));
  roots.push(root);
  await writeFile(join(root, "package.json"), JSON.stringify({ jest: { reporters: [] } }));
  return root;
}

test("clears old coverage and keeps current coverage after Jest succeeds", async () => {
  const root = await createRoot();
  const coverage = join(root, "coverage");
  await mkdir(coverage);
  await writeFile(join(coverage, "old-report.json"), "old");
  const execute = jest.fn(async (_command, args) => {
    const directory = args[args.indexOf("--coverageDirectory") + 1];
    await writeFile(join(directory, "coverage-final.json"), "current");
    await writeFile(
      join(directory, "jest-console-output.json"),
      JSON.stringify([{ testFilePath: "tests/example.test.mjs", type: "log", message: "output" }]),
    );
    return { code: 0, stdout: "passed", stderr: "" };
  });

  const result = await runJest(root, [], execute);

  expect(execute).toHaveBeenCalledTimes(1);
  expect(result.coverageDirectory).toBe(coverage);
  expect(result.consoleOutput).toEqual([
    { testFilePath: "tests/example.test.mjs", type: "log", message: "output" },
  ]);
  await expect(readFile(join(coverage, "coverage-final.json"), "utf8")).resolves.toBe("current");
  await expect(readFile(join(coverage, "jest-console-output.json"), "utf8")).resolves.toContain(
    "tests/example.test.mjs",
  );
  await expect(readFile(join(coverage, "old-report.json"), "utf8")).rejects.toMatchObject({
    code: "ENOENT",
  });
  expect(findUnexpectedJestOutput(result, [], root)).toEqual([
    expect.stringContaining("Unexpected output from unknown test suite: passed"),
    expect.stringContaining("console.log in tests/example.test.mjs: output"),
  ]);
});

test.each([
  [{ code: 1, stdout: "failed", stderr: "" }, "failed"],
  [{ code: null, timedOut: true, stdout: "timed out", stderr: "" }, "timed out"],
])("keeps the consumer coverage directory when Jest does not pass", async (outcome, output) => {
  const root = await createRoot();
  const result = await runJest(root, [], async (_command, args) => {
    const directory = args[args.indexOf("--coverageDirectory") + 1];
    await writeFile(join(directory, "partial-report.json"), "partial");
    return outcome;
  });

  expect(result.stdout).toBe(output);
  await expect(readFile(join(root, "coverage", "partial-report.json"), "utf8")).resolves.toBe(
    "partial",
  );
});

test("keeps the prepared coverage directory when the executor rejects", async () => {
  const root = await createRoot();
  await expect(
    runJest(root, undefined, () => {
      throw new Error("Jest could not start");
    }),
  ).rejects.toThrow("Jest could not start");
  await expect(lstat(join(root, "coverage"))).resolves.toMatchObject({
    isDirectory: expect.any(Function),
  });
});
