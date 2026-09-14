import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.5.mjs";

test("resolves library entrypoint metadata across export shapes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-ignore-entrypoints-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "index.mjs"), "export * from './value.mjs';\n");
  await expect(
    run({
      root,
      packageJson: {
        eliware: { apply: ["library"] },
        exports: { ".": { import: "./src/index.mjs", default: "./src/index.mjs" } },
        main: "src/index.mjs",
        module: "src/index.mjs",
      },
    }),
  ).resolves.toMatchObject({ status: "pass" });
  await expect(
    run({
      root,
      packageJson: { eliware: { apply: ["library"] }, exports: "./src/index.mjs" },
    }),
  ).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});
