import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.17.mjs";

async function createPair() {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-mirror-"));
  await mkdir(join(root, "src", "nested"), { recursive: true });
  await mkdir(join(root, "tests", "nested"), { recursive: true });
  await writeFile(join(root, "src", "nested", "module.mjs"), "export {};\n");
  await writeFile(join(root, "tests", "nested", "module.test.mjs"), 'import "../../src/nested/module.mjs"; test("ok", () => {});\n');
  return root;
}

test("passes when the full source/test structure is mirrored", async () => {
  const root = await createPair();
  try {
    await expect(run({ root })).resolves.toEqual({
      ruleId: "E-1.17",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("returns aggregated mirror diagnostics when a source test is missing", async () => {
  const root = await createPair();
  try {
    await rm(join(root, "tests", "nested", "module.test.mjs"));
    await expect(run({ root })).resolves.toEqual(expect.objectContaining({
      ruleId: "E-1.17",
      status: "fail",
      message: expect.stringContaining("nested/module.test.mjs"),
    }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports missing repository roots and aggregates orphan, artifact, and generated-source findings", async () => {
  const missingRoot = await mkdtemp(join(tmpdir(), "eliware-test-mirror-missing-"));
  try {
    await expect(run({ root: missingRoot })).resolves.toEqual(expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("src/ is required"),
    }));
  } finally {
    await rm(missingRoot, { recursive: true, force: true });
  }

  const root = await createPair();
  try {
    await mkdir(join(root, "src", "nested", "fixtures"), { recursive: true });
    await mkdir(join(root, "tests", "nested", "fixtures"), { recursive: true });
    await writeFile(join(root, "src", "nested", "generated.mjs"), "webpackJsonp([]);\n");
    await writeFile(join(root, "tests", "nested", "generated.test.mjs"), 'import "../../src/nested/generated.mjs"; test("ok", () => {});\n');
    await writeFile(join(root, "tests", "nested", "fixtures", "values.json"), "{}\n");
    await writeFile(join(root, "tests", "nested", "orphan.test.mjs"), 'test("orphan", () => {});\n');
    await expect(run({ root })).resolves.toEqual(expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("orphan.test.mjs"),
    }));
    const result = await run({ root });
    expect(result.message).toContain("test artifacts must be under artifacts/");
    expect(result.message).toContain("generated or bundled source is not allowed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps focused pair validation findings to the rule result", async () => {
  const root = await createPair();
  try {
    const scope = { sourcePath: "src/nested/module.mjs", testPath: "tests/nested/module.test.mjs" };
    await expect(run({ root, focusedScope: scope })).resolves.toEqual({
      ruleId: "E-1.17",
      status: "pass",
      message: "",
    });
    await expect(run({ root, focusedScope: {
      ...scope,
      sourcePath: "src/nested/missing.mjs",
    } })).resolves.toEqual(expect.objectContaining({
      ruleId: "E-1.17",
      status: "fail",
      message: expect.stringContaining("missing mirrored source"),
    }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
