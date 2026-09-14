import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/library/E-1.40/A-1.40.3.mjs";

test("requires library README topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-library-"));
  await writeFile(
    join(root, "README.md"),
    "purpose requirements setup configuration usage api validation packaging security support license docs/ examples/",
  );
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "README.md"), "purpose");
  expect((await run({ root })).status).toBe("fail");
});

test("reports a missing library README", async () => {
  await expect(run({ root: "C:\\missing-library-repository" })).resolves.toEqual({
    ruleId: "A-1.40.3",
    status: "fail",
    message: "Library README.md is required.",
  });
});

test("rejects an incomplete optional examples index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-library-"));
  await writeFile(join(root, "README.md"), "purpose requirements setup configuration usage api validation packaging security support license docs/ examples/");
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "examples", "README.md"), "Purpose\nCommand");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail", message: expect.stringContaining("prerequisites") }));
});

test("accepts a complete optional examples index", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-library-"));
  await writeFile(join(root, "README.md"), "purpose requirements setup configuration usage api validation packaging security support license docs/ examples/");
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "examples", "README.md"), "Purpose\nPrerequisites\nCommand\nExpected result");
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.40.3", status: "pass", message: "" });
});
