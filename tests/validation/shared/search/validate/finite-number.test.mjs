import { expect, test } from "@jest/globals";
import { assertFiniteTreeNumber } from "../../../../../src/validation/shared/search/validate/finite-number.mjs";

test("accepts finite numeric values", () => {
  expect(() => assertFiniteTreeNumber(0, "insert")).not.toThrow();
  expect(() => assertFiniteTreeNumber(-3.5, "range")).not.toThrow();
});

test.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
  "rejects non-finite values %p",
  (value) => {
    expect(() => assertFiniteTreeNumber(value, "insert")).toThrow(
      "Balanced numeric tree insert values must be finite numbers.",
    );
  },
);
