import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/library/E-0.1.40/A-0.1.40.5.mjs";

test("requires a public entrypoint and package allowlist", async () => {
  expect((await run({ packageJson: { main: "./src/index.mjs", files: ["src"] } })).status).toBe(
    "pass",
  );
  expect((await run({ packageJson: { files: ["src"] } })).status).toBe("fail");
  expect((await run({ packageJson: { main: "src/index.mjs", files: [] } })).status).toBe("fail");
});

test("rejects missing exported and declaration targets", async () => {
  await expect(
    run({
      root: "C:/missing",
      packageJson: { exports: { ".": "./dist/index.mjs" }, files: ["src"] },
    }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("entrypoint") });
  await expect(
    run({
      root: "C:/missing",
      packageJson: { main: "./dist/index.mjs", types: "./dist/index.d.ts", files: ["src"] },
    }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("entrypoint") });
});

test("accepts existing static export and declaration targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-library-entry-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "index.mjs"), "export {};");
  await writeFile(join(root, "src", "index.d.ts"), "export {};");
  await expect(
    run({
      root,
      packageJson: {
        exports: {
          ".": ["./src/index.mjs", { types: "./src/index.d.ts", import: "./src/index.mjs" }],
          "./*": "./src/*",
        },
        files: ["src/"],
        types: "./src/[generated].d.ts",
      },
    }),
  ).resolves.toMatchObject({ status: "pass" });
});

test("rejects a missing declaration target after a valid entrypoint", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-library-declaration-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "index.mjs"), "export {};");
  await expect(
    run({
      root,
      packageJson: {
        main: "./src/index.mjs",
        types: "./src/index.d.ts",
        files: ["src"],
      },
    }),
  ).resolves.toMatchObject({ status: "fail", message: expect.stringContaining("declaration") });
});

test("rejects a missing runtime target under src/", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-library-missing-entry-"));
  await expect(
    run({ root, packageJson: { main: "./src/missing.mjs", files: ["src/"] } }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("Library entrypoint target does not exist"),
  });
});

test("rejects root runtime and declaration entrypoints", async () => {
  expect(
    await run({
      packageJson: { main: "./index.mjs", types: "./index.d.ts", files: ["src"] },
    }),
  ).toMatchObject({ status: "fail", message: expect.stringContaining("under src/") });
});

test("handles null conditional export entries", async () => {
  await expect(
    run({ packageJson: { exports: { ".": null }, files: ["package.json"] } }),
  ).resolves.toMatchObject({ status: "pass" });
});
