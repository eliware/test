import { expect, test } from "@jest/globals";
import method from "../../../../../../../../src/validation/shared/repository/create-repository/directory/read/version/has-directory-version-changed.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
