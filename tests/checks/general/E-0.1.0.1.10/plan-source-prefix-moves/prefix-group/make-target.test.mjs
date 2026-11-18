import { expect, test } from "@jest/globals";
import method from "../../../../../../src/checks/general/E-0.1.0.1.10/plan-source-prefix-moves/prefix-group/make-target.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
