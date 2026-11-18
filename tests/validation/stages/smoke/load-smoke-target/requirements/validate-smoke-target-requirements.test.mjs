import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/stages/smoke/load-smoke-target/requirements/validate-smoke-target-requirements.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
