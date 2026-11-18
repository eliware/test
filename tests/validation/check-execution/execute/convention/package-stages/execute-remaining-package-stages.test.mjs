import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/check-execution/execute/convention/package-stages/execute-remaining-package-stages.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
