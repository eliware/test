import { expect, test } from "@jest/globals";
import readRepositoryParsed from "../../../../../../src/validation/shared/repository/read/repository-text/read-repository-parsed.mjs";
test("exports the parsed repository reader", () => {
  expect(typeof readRepositoryParsed).toBe("function");
});
