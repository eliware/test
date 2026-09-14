import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { collect, run } from "../../../../src/checks/general/E-1/E-1.17.mjs";

async function fixture(withTest = true) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-mirror-"));
  await mkdir(join(root, "src", "nested"), { recursive: true });
  await mkdir(join(root, "tests", "nested"), { recursive: true });
  await writeFile(join(root, "src", "nested", "module.mjs"), "export {};");
  if (withTest) await writeFile(join(root, "tests", "nested", "module.test.mjs"), "import \"../../src/nested/module.mjs\"; test();");
  return root;
}

test("passes when every source module has a mirrored test", async () => {
  const root = await fixture();
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.17", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports missing mirrored tests", async () => {
  const root = await fixture(false);
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("nested/module.test.mjs"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports orphan tests that have no source module", async () => {
  const root = await fixture();
  await writeFile(join(root, "tests", "nested", "orphan.test.mjs"), "test();");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("orphan.test.mjs"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects test files without the mirrored test suffix", async () => {
  const root = await fixture();
  await writeFile(join(root, "tests", "nested", "module.mjs"), "test();");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("invalid test paths"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports a missing tests directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-mirror-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "module.mjs"), "export {}; ");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("rejects fixture-like modules outside artifacts", async () => {
  const root = await fixture();
  await writeFile(join(root, "src", "fixture.mjs"), "export {}; ");
  await writeFile(join(root, "tests", "fixture.test.mjs"), "test();");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("artifacts/") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects non-ESM source artifacts in src", async () => {
  const root = await fixture();
  await writeFile(join(root, "src", "bundle.js"), "module.exports = {}; ");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("invalid source") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects generated or bundled source content", async () => {
  const root = await fixture();
  await writeFile(join(root, "src", "bundle.mjs"), "webpackJsonp([1]);");
  await writeFile(join(root, "tests", "bundle.test.mjs"), "test();");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("generated or bundled source is not allowed"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects cross-cutting tests that do not have a source counterpart", async () => {
  const root = await fixture();
  await mkdir(join(root, "tests", "architecture"), { recursive: true });
  await writeFile(join(root, "tests", "architecture", "overview.test.mjs"), "test();");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("overview.test.mjs") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("requires non-module files to preserve exact file counts", async () => {
  const root = await fixture();
  await writeFile(join(root, "src", "notes.txt"), "documentation");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("file or directory counts differ") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("supports direct collection with the directory as its root", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-mirror-collect-"));
  await writeFile(join(root, "module.mjs"), "export {}; ");
  expect(await collect(root)).toEqual(["module.mjs"]);
  await rm(root, { recursive: true, force: true });
});

test("ignores directory entries that are neither files nor directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-mirror-entry-"));
  expect(
    await collect(root, root, async () => [
      { name: "special", isDirectory: () => false, isFile: () => false },
    ]),
  ).toEqual([]);
  await rm(root, { recursive: true, force: true });
});
