import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { exportTargets, run } from "../../../../src/checks/library/E-1.40/A-1.40.5.mjs";

test("requires a public entrypoint and package allowlist", async () => {
  expect((await run({ packageJson: { main: "src/index.mjs", files: ["src"] } })).status).toBe("pass");
  expect((await run({ packageJson: { files: ["src"] } })).status).toBe("fail");
  expect((await run({ packageJson: { main: "src/index.mjs", files: [] } })).status).toBe("fail");
});

test("rejects missing exported and declaration targets", async () => {
  await expect(run({
    root: "C:/missing",
    packageJson: { exports: { ".": "./dist/index.mjs" }, files: ["src"] },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("entrypoint") });
  await expect(run({
    root: "C:/missing",
    packageJson: { main: "./dist/index.mjs", types: "./dist/index.d.ts", files: ["src"] },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("entrypoint") });
});

test("accepts existing static export and declaration targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-library-entry-"));
  await writeFile(join(root, "index.mjs"), "export {};" );
  await writeFile(join(root, "index.d.ts"), "export {};" );
  await expect(run({
    root,
    packageJson: {
      exports: { ".": ["./index.mjs", { types: "./index.d.ts", import: "./index.mjs" }], "./*": "./dist/*" },
      files: ["index.mjs", "index.d.ts"],
      types: "./[generated].d.ts",
    },
  })).resolves.toMatchObject({ status: "pass" });
});

test("rejects a missing declaration target after a valid entrypoint", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-library-declaration-"));
  await writeFile(join(root, "index.mjs"), "export {};" );
  await expect(run({
    root,
    packageJson: { main: "./index.mjs", types: "./index.d.ts", files: ["index.mjs"] },
  })).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("declaration") });
});

test("handles null conditional export entries", async () => {
  await expect(run({ packageJson: { exports: { ".": null }, files: ["package.json"] } })).resolves.toMatchObject({ status: "pass" });
});

test("normalizes all export target value shapes", () => {
  expect(exportTargets(null)).toEqual([]);
  expect(exportTargets(["./one", { import: "./two" }])).toEqual(["./one", "./two"]);
});
