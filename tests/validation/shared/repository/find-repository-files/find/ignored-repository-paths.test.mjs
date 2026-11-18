import { expect, test } from "@jest/globals";
import method from "../../../../../../src/validation/shared/repository/find-repository-files/find/ignored-repository-paths.mjs";

test("exports one default method", () => {
  expect(typeof method).toBe("function");
});
