import { expect, test } from "@jest/globals";
import findTestPaths from "../../../../src/checks/shared/layout/find-test-paths.mjs";
test("selects only Jest test paths", () => {
  expect(
    findTestPaths([
      "src/a.mjs",
      "tests/a.test.mjs",
      "tests/helper.mjs",
      "tests/b.test.js",
      "tests/nested/c.test.mjs",
    ]),
  ).toEqual(["tests/a.test.mjs", "tests/nested/c.test.mjs"]);
});
