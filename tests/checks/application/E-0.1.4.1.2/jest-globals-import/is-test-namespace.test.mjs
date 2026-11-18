import { expect, test } from "@jest/globals";
import method from "../../../../../src/checks/application/E-0.1.4.1.2/jest-globals-import/is-test-namespace.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
