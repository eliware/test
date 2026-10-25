import { expect, test } from "@jest/globals";
import { collectPackedEntrypointTargets } from "../../../../../../../src/validation/stages/pack/validate/packed/entrypoints/targets.mjs";

test("collects supported entrypoint fields and filters export labels", () => {
  expect(
    collectPackedEntrypointTargets({
      main: "src/index.mjs",
      bin: { cli: "./bin/cli.mjs" },
      exports: { ".": "./src/index.mjs", node: "node:fs", optional: null },
      imports: { "#internal": "./src/internal.mjs" },
    }),
  ).toEqual(["src/index.mjs", "bin/cli.mjs", "src/internal.mjs"]);
});

test("collects targets nested in metadata and skips internal specifiers", () => {
  expect(
    collectPackedEntrypointTargets({
      exports: { ".": { import: "./src/index.mjs", types: "./src/index.d.ts" } },
      typesVersions: { "*": { "*": ["types/*.d.ts"] } },
      imports: { "#local": "./src/local.mjs" },
    }),
  ).toEqual(["src/index.mjs", "src/index.d.ts", "types/*.d.ts", "src/local.mjs"]);
});

test.each([
  ["main", "src/main.mjs"],
  ["module", "src/module.mjs"],
  ["types", "types/index.d.ts"],
  ["typings", "types/legacy.d.ts"],
  ["bin", { cli: "bin/cli.mjs" }],
  ["exports", { ".": "./src/export.mjs" }],
  ["browser", "browser/index.mjs"],
  ["unpkg", "dist/bundle.js"],
  ["jsdelivr", "dist/bundle.min.js"],
  ["typesVersions", { "*": { "*": ["types/versioned/*.d.ts"] } }],
  ["imports", { "#internal": "./src/internal.mjs" }],
])("collects targets from package field %s", (field, value) => {
  expect(collectPackedEntrypointTargets({ [field]: value })).not.toEqual([]);
});
