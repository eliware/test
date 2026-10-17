import { expect, test } from "@jest/globals";
import { validatePackedEntrypoints } from "../../../../../src/validation/stages/pack/validate/packed-entrypoints.mjs";

test("accepts main, bin, and conditional export targets found in the tarball", () => {
  expect(
    validatePackedEntrypoints(
      {
        main: "./src/index.mjs",
        bin: { cli: "./bin/cli.mjs" },
        exports: {
          ".": {
            import: "./src/index.mjs",
            types: "./src/index.d.ts",
            default: ["./src/index.mjs"],
          },
        },
      },
      new Set(["src/index.mjs", "src/index.d.ts", "bin/cli.mjs"]),
    ),
  ).toBeNull();
});

test("matches wildcard export targets and reports missing public targets", () => {
  expect(
    validatePackedEntrypoints(
      { exports: { "./features/*": "./src/features/*.mjs" }, typings: "./types/index.d.ts" },
      new Set(["src/features/a.mjs"]),
    ),
  ).toContain("types/index.d.ts");
});

test("matches nested files for Node.js wildcard export targets", () => {
  expect(
    validatePackedEntrypoints(
      { exports: { "./features/*": "./src/features/*.mjs" } },
      new Set(["src/features/nested/feature.mjs"]),
    ),
  ).toBeNull();
});

test("rejects wildcard targets with an empty substitution", () => {
  expect(
    validatePackedEntrypoints(
      { exports: { "./features/*": "./src/features/*.mjs" } },
      new Set(["src/features/.mjs"]),
    ),
  ).toContain("src/features/*.mjs");
});

test("ignores package export labels and built-in targets", () => {
  expect(
    validatePackedEntrypoints(
      { main: "#internal", exports: { "./optional": null, node: "node:fs" } },
      new Set(),
    ),
  ).toBeNull();
  expect(validatePackedEntrypoints(undefined, new Set())).toBeNull();
});

test("rejects unmatched wildcard entrypoints", () => {
  expect(
    validatePackedEntrypoints({ exports: { "./features/*": "./src/features/*.mjs" } }, new Set()),
  ).toContain("src/features/*.mjs");
});

test("validates relative and bare paths from public entrypoint fields", () => {
  expect(
    validatePackedEntrypoints(
      { main: "src/index.mjs", bin: { cli: "bin/cli.mjs" } },
      new Set(["src/index.mjs", "bin/cli.mjs"]),
    ),
  ).toBeNull();
  expect(validatePackedEntrypoints({ bin: "bin/missing.mjs" }, new Set())).toContain(
    "bin/missing.mjs",
  );
});

const targetCases = [
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
];

test("requires targets from every supported package metadata field", () => {
  const packageJson = Object.fromEntries(targetCases);
  const packed = new Set([
    "src/main.mjs",
    "src/module.mjs",
    "types/index.d.ts",
    "types/legacy.d.ts",
    "bin/cli.mjs",
    "src/export.mjs",
    "browser/index.mjs",
    "dist/bundle.js",
    "dist/bundle.min.js",
    "types/versioned/current.d.ts",
    "src/internal.mjs",
  ]);
  expect(validatePackedEntrypoints(packageJson, packed)).toBeNull();
});

test.each(targetCases)("rejects a missing %s target", (field, value) => {
  expect(validatePackedEntrypoints({ [field]: value }, new Set())).not.toBeNull();
});
