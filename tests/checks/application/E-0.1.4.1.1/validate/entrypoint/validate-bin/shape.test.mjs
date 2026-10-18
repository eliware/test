import { expect, test } from "@jest/globals";
import { validateBinShape } from "../../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/validate-bin/shape.mjs";

test("accepts an absent bin or a command map", () => {
  expect(validateBinShape(undefined)).toEqual([]);
  expect(validateBinShape({ app: "bin/app.mjs" })).toEqual([]);
});

test("accepts nonempty string targets", () => {
  expect(validateBinShape("bin/app.mjs")).toEqual([]);
});

test("rejects invalid bin shapes and blank string targets", () => {
  expect(validateBinShape([])).toEqual(["package.json bin must be a path or a command map."]);
  expect(validateBinShape(" ")).toEqual(["package.json bin must be a nonempty path string."]);
});
