import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/shared/repository/read/stable-file-content/read-stable-file-content.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
