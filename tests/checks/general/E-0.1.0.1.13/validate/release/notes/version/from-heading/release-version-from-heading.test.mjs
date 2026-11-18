import { expect, test } from "@jest/globals";
import method from "../../../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/version/from-heading/release-version-from-heading.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
