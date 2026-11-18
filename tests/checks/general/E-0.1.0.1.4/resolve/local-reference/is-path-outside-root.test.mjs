import { expect, test } from "@jest/globals";
import method from "../../../../../../src/checks/general/E-0.1.0.1.4/resolve/local-reference/is-path-outside-root.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
