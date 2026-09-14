import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.16.mjs";

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
    ruleId: "E-1.20.16",
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
    ruleId: "E-1.20.16",
    status: "fail",
    message: "src/ and tests/ are required for monolith-limit validation.",
  });
  await rm(root, { recursive: true, force: true });
});
