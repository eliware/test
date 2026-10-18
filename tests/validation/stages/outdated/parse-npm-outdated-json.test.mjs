import { expect, test } from "@jest/globals";
import { parseNpmOutdatedJson } from "../../../../src/validation/stages/outdated/parse-npm-outdated-json.mjs";

test("parses npm outdated JSON", () => {
  expect(parseNpmOutdatedJson('{"alpha":{"current":"1.0.0"}}')).toEqual({
    alpha: { current: "1.0.0" },
  });
});

test("throws when npm outdated returns invalid JSON", () => {
  expect(() => parseNpmOutdatedJson("not-json")).toThrow(SyntaxError);
});
