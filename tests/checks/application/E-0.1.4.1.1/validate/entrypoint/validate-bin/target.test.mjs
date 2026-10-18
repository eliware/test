import { expect, test } from "@jest/globals";
import { isValidBinTarget } from "../../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/validate-bin/target.mjs";

test("accepts nonempty string targets", () => {
  expect(isValidBinTarget("bin/app.mjs")).toBe(true);
});

test("rejects blank and nonstring targets", () => {
  expect(isValidBinTarget(" ")).toBe(false);
  expect(isValidBinTarget(null)).toBe(false);
});
