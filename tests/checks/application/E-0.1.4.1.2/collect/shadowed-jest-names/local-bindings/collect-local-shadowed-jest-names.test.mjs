import { expect, test } from "@jest/globals";
import method from "../../../../../../../src/checks/application/E-0.1.4.1.2/collect/shadowed-jest-names/local-bindings/collect-local-shadowed-jest-names.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
