import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runPureExportBarrelPolicy } from "../../../../../src/checks/general/E-1/E-1.20/validate-pure-export-barrels.mjs";
const run = (options) => runPureExportBarrelPolicy({ ...options, ruleId: "E-1.40.14" });

async function fixture(source, packageJson) {
  const root = await mkdtemp(join(tmpdir(), "eliware-barrel-"));
  await mkdir(join(root, "src"), { recursive: true });
  await writeFile(join(root, "src", "entry.mjs"), source);
  return { root, packageJson };
}

test("allows a declared public library entrypoint", async () => {
  const context = await fixture('export { value } from "./value.mjs";\n', {
    main: "src/entry.mjs",
    eliware: { apply: ["library"] },
  });
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await rm(context.root, { recursive: true, force: true });
});

test("rejects an internal pure export barrel", async () => {
  const context = await fixture('export { value } from "./value.mjs";\n', {
    main: "src/index.mjs",
    eliware: { apply: ["general"] },
  });
  await expect(run(context)).resolves.toMatchObject({ status: "fail" });
  await rm(context.root, { recursive: true, force: true });
});

test("allows a library root index without package entry metadata", async () => {
  const context = await fixture('export * from "./value.mjs";\n', {
    eliware: { apply: ["library"] },
  });
  await writeFile(join(context.root, "src", "index.mjs"), 'export * from "./value.mjs";\n');
  await rm(join(context.root, "src", "entry.mjs"));
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await rm(context.root, { recursive: true, force: true });
});

test("resolves the root condition of an exports map", async () => {
  const context = await fixture('export { value } from "./value.mjs";\n', {
    exports: { ".": { import: "./src/entry.mjs", default: "./src/entry.mjs" } },
    eliware: { apply: ["library"] },
  });
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await rm(context.root, { recursive: true, force: true });
});

test("does not classify implementation text as a barrel", async () => {
  const context = await fixture('// export * from "./value.mjs";\nconst text = "import value";\n', {
    eliware: { apply: ["general"] },
  });
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await rm(context.root, { recursive: true, force: true });
});

test("reports malformed source as a failed policy result", async () => {
  const context = await fixture("export {\n", { eliware: { apply: ["general"] } });
  await expect(run(context)).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("could not be classified"),
  });
  await rm(context.root, { recursive: true, force: true });
});

test("supports array exports and module entry metadata", async () => {
  const context = await fixture('export { value } from "./value.mjs";\n', {
    exports: ["./src/entry.mjs"],
    module: "./src/entry.mjs",
    eliware: { apply: ["library"] },
  });
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await rm(context.root, { recursive: true, force: true });
});

test("supports a single string export entrypoint", async () => {
  const context = await fixture('export { value } from "./value.mjs";\n', {
    exports: "./src/entry.mjs",
    eliware: { apply: ["library"] },
  });
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await rm(context.root, { recursive: true, force: true });
});

test("collects conditional exports without a root and ignores null conditions", async () => {
  const context = await fixture('export { value } from "./value.mjs";\n', {
    exports: { import: null, default: "./src/entry.mjs" },
    eliware: { apply: ["library"] },
  });
  await expect(run(context)).resolves.toMatchObject({ status: "pass" });
  await rm(context.root, { recursive: true, force: true });
});
