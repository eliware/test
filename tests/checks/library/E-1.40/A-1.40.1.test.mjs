import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/library/E-1.40/A-1.40.1.mjs";

test("requires library docs, examples, and allowlist", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-library-"));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await writeFile(join(root, "examples", "README.md"), "Purpose\nPrerequisites\nCommand\nExpected result\n[basic.mjs](basic.mjs)");
  await writeFile(join(root, "examples", "basic.mjs"), "console.log('example');");
  expect((await run({ root, packageJson: { files: ["src"] } })).status).toBe("pass");
  await expect(run({
    root,
    packageJson: { files: ["src"] },
    executeExample: async () => ({ code: 1, stdout: "", stderr: "example failed" }),
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("example failed") });
  await expect(run({
    root,
    packageJson: { files: ["src"] },
    executeExample: async () => ({ code: 1 }),
  })).resolves.toMatchObject({ status: "fail", message: "Example basic.mjs failed." });
  await expect(run({
    root,
    packageJson: { files: ["src"] },
    executeExample: async () => { throw new Error("spawn failed"); },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("could not run") });
  expect((await run({ root, packageJson: { files: [] } })).status).toBe("fail");
});

test("reports missing runnable examples and indexes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-library-"));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await writeFile(join(root, "examples", "README.md"), "examples");
  await expect(run({ root, packageJson: { files: ["src"] } })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "Libraries must provide at least one runnable example.",
    }),
  );
  await expect(run({ root: `${root}-missing`, packageJson: { files: ["src"] } })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "Libraries must provide complete docs/ and examples/ indexes.",
    }),
  );
  await writeFile(join(root, "examples", "README.md"), "Purpose\nPrerequisites\nCommand\nExpected result");
  await writeFile(join(root, "examples", "basic.mjs"), "console.log('example');");
  await expect(run({ root, packageJson: { files: ["src"] } })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("index") }),
  );
});
