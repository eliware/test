import { expect, test } from "@jest/globals";
import method from "../../../../../src/cli/write/success-summary/format/aggregate-success.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
