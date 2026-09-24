import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/library/E-1.40/A-1.40.1.mjs";

async function createLibrary() {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-library-"));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await writeFile(join(root, "examples", "README.md"), "Purpose\nPrerequisites\nCommand\nExpected result\n[basic.mjs](basic.mjs)");
  await writeFile(join(root, "examples", "basic.mjs"), "console.log('example');");
  return root;
}

test("composes example inspection, execution, and package metadata validation", async () => {
  const root = await createLibrary();
  try {
    await expect(run({
      root,
      packageJson: { files: ["src"] },
      executeExample: async () => ({ code: 0, stdout: "", stderr: "" }),
    })).resolves.toEqual({ ruleId: "A-1.40.1", status: "pass", message: "" });
    await expect(run({
      root,
      packageJson: { files: [] },
      executeExample: async () => ({ code: 0, stdout: "", stderr: "" }),
    })).resolves.toMatchObject({
      ruleId: "A-1.40.1",
      status: "fail",
      message: "Libraries must declare a package file allowlist.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps incomplete documentation and example surfaces to a rule failure", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-library-missing-"));
  try {
    await expect(run({ root, packageJson: { files: ["src"] } })).resolves.toEqual(
      expect.objectContaining({
        ruleId: "A-1.40.1",
        status: "fail",
        message: "Libraries must provide complete docs/ and examples/ indexes.",
      }),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps example-surface and process failures without running later stages", async () => {
  const noExamples = await createLibrary();
  try {
    await rm(join(noExamples, "examples", "basic.mjs"));
    await expect(run({ root: noExamples, packageJson: { files: ["src"] } })).resolves.toMatchObject({
      status: "fail",
      message: "Libraries must provide at least one runnable example.",
    });
  } finally {
    await rm(noExamples, { recursive: true, force: true });
  }

  const failingExample = await createLibrary();
  try {
    await expect(run({
      root: failingExample,
      packageJson: { files: [] },
      executeExample: async () => ({ code: 1, stderr: "broken" }),
    })).resolves.toMatchObject({ status: "fail", message: "Example basic.mjs failed: broken" });
  } finally {
    await rm(failingExample, { recursive: true, force: true });
  }
});
