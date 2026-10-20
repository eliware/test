import { expect, test } from "@jest/globals";
import { collectNestedStringValues } from "../../../../src/validation/shared/package/collect-nested-string-values.mjs";

test("collects strings recursively from arrays and objects", () => {
  expect(
    collectNestedStringValues({
      root: "./index.mjs",
      conditions: ["./types.d.ts", { browser: "./browser.mjs" }],
      optional: null,
    }),
  ).toEqual(["./index.mjs", "./types.d.ts", "./browser.mjs"]);
});

test("appends to a supplied result array", () => {
  const values = ["existing"];
  expect(collectNestedStringValues({ target: "next" }, values)).toBe(values);
  expect(values).toEqual(["existing", "next"]);
});
