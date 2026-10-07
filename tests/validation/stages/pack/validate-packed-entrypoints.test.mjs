import { expect, test } from "@jest/globals";
import { validatePackedEntrypoints } from "../../../../src/validation/stages/pack/validate-packed-entrypoints.mjs";

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
