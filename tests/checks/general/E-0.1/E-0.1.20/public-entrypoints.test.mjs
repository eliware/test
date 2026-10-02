import { expect, test } from "@jest/globals";
import { publicEntrypoints } from "../../../../../src/checks/general/E-0.1/E-0.1.20/public-entrypoints.mjs";

test("collects normalized package entrypoints and export conditions", () => {
  expect(
    publicEntrypoints({
      main: "./src/main.mjs",
      exports: { ".": { import: "./src/index.mjs", require: "./src/cjs.cjs" } },
    }),
  ).toEqual(new Set(["src/main.mjs", "src/index.mjs", "src/cjs.cjs"]));
  expect(publicEntrypoints({ exports: ["./src/array.mjs"] })).toEqual(
    new Set(["src/array.mjs", "src/index.mjs"]),
  );
  expect(publicEntrypoints({ exports: "./src/string.mjs" })).toEqual(
    new Set(["src/string.mjs", "src/index.mjs"]),
  );
  expect(publicEntrypoints({ exports: { "./feature": { default: "./src/feature.mjs" } } })).toEqual(
    new Set(["src/feature.mjs", "src/index.mjs"]),
  );
  expect(publicEntrypoints({ exports: { ".": null } })).toEqual(new Set(["src/index.mjs"]));
  expect(publicEntrypoints()).toEqual(new Set(["src/index.mjs"]));
});
