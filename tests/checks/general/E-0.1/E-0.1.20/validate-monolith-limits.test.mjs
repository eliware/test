import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { runMonolithLimits } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-monolith-limits.mjs";
const run = (options) => runMonolithLimits({ ruleId: "E-0.1.130.10", requireTests: true, ...options });

async function fixture(lines) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-monolith-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "src", "module.mjs"), `${"x\n".repeat(lines)}export {};`);
  await writeFile(join(root, "tests", "module.test.mjs"), "test();");
  return root;
}

async function writeLines(root, directory, name, lines, trailingNewline = true) {
  const content = `${"x\n".repeat(Math.max(0, lines - 1))}x${trailingNewline ? "\n" : ""}`;
  await writeFile(join(root, directory, name), content);
}

test("passes when source and test files remain within their limits", async () => {
  const root = await fixture(10);
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.130.10",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports source files over the 100-line limit", async () => {
  const root = await fixture(101);
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("src/module.mjs") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("counts a file without a trailing newline accurately", async () => {
  const root = await fixture(10);
  await writeLines(root, "src", "short.mjs", 101, false);
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("short.mjs"),
  });
  await rm(root, { recursive: true, force: true });
});

test("enforces the 200-line test limit", async () => {
  const root = await fixture(10);
  await writeLines(root, "tests", "module.test.mjs", 201);
  await expect(run({ root })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("module.test.mjs"),
  });
  await rm(root, { recursive: true, force: true });
});

test("ignores generated, fixture, and dependency artifacts", async () => {
  const root = await fixture(10);
  await mkdir(join(root, "src", "generated"));
  await mkdir(join(root, "src", "node_modules"));
  await mkdir(join(root, "tests", "test-fixtures"));
  await writeLines(root, "src/generated", "generated.mjs", 101);
  await writeLines(root, "src/node_modules", "dependency.mjs", 101);
  await writeLines(root, "tests/test-fixtures", "fixture.mjs", 201);
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("handles empty files, non-module files, nested directories, and excluded filenames", async () => {
  const root = await fixture(10);
  await mkdir(join(root, "src", "nested"));
  await writeFile(join(root, "src", "nested", "nested.mjs"), "export {};\n");
  await writeFile(join(root, "src", "notes.txt"), "not source\n");
  await writeFile(join(root, "src", "empty.mjs"), "");
  await writeLines(root, "src", "types.d.mts", 101);
  await writeLines(root, "src", "snapshot.snap.mjs", 101);
  await writeLines(root, "src", "bundle.generated.mjs", 101);
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("fails when the required source or test directory is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-monolith-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.130.10",
    status: "fail",
    message: "src/ is required for monolith-limit validation.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports a missing required tests directory after scanning source", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-missing-tests-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "export {};\n");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-0.1.130.10",
    status: "fail",
    message: "tests/ is required for monolith-limit validation.",
  });
  await rm(root, { recursive: true, force: true });
});

test("allows a profile without tests to enforce source limits only", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-source-only-monolith-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "export {};\n");
  await expect(runMonolithLimits({ root, ruleId: "E-0.1.130.10" })).resolves.toMatchObject({
    status: "pass",
  });
  await rm(root, { recursive: true, force: true });
});

test("preserves inventory permission errors instead of reporting a missing directory", async () => {
  const inventoryError = Object.assign(new Error("permission denied"), { code: "EACCES" });
  await expect(run({
    root: "/repo",
    repositoryInventory: { entriesUnder: async () => { throw inventoryError; } },
  })).resolves.toEqual({
    ruleId: "E-0.1.130.10",
    status: "fail",
    message: "Could not validate src/ monolith limits: permission denied",
  });
});

test("preserves inventory errors while checking required test files", async () => {
  const inventoryError = Object.assign(new Error("tests access denied"), { code: "EACCES" });
  await expect(run({
    root: "/repo",
    repositoryInventory: {
      entriesUnder: async (directory) => {
        if (directory.endsWith("tests")) throw inventoryError;
        return [];
      },
    },
  })).resolves.toEqual({
    ruleId: "E-0.1.130.10",
    status: "fail",
    message: "Could not validate tests/ monolith limits: tests access denied",
  });
});
