import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.20/E-1.20.2.mjs";

test("requires native ESM", async () => {
  expect(await run({ packageJson: { type: "module" } })).toEqual({
    ruleId: "E-1.20.2",
    status: "pass",
    message: "",
  });
  expect(await run({ packageJson: { type: "commonjs" } })).toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("rejects CommonJS source artifacts in an ESM repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-esm-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "module.exports = {};\n");
  await expect(run({ root, packageJson: { type: "module" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects require calls in an ESM repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-require-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), 'const dependency = require("dependency");\n');
  await expect(run({ root, packageJson: { type: "module" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("require()") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports failures while inspecting repository modules", async () => {
  await expect(
    run({ root: "C:\\missing-repository", packageJson: { type: "module" } }),
  ).resolves.toEqual(
    expect.objectContaining({
      ruleId: "E-1.20.2",
      status: "fail",
      message: expect.stringContaining("Repository modules could not be inspected for native ESM"),
    }),
  );
});

test("passes when inspected ESM sources contain no CommonJS artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-esm-clean-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "export const value = 1;\n");
  await expect(run({ root, packageJson: { type: "module" } })).resolves.toEqual({
    ruleId: "E-1.20.2",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});
