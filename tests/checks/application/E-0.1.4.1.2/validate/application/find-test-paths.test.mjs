import { expect, test } from "@jest/globals";
import { findApplicationTestPaths } from "../../../../../../src/checks/application/E-0.1.4.1.2/validate/application/find-test-paths.mjs";

test("selects only Jest test paths", () => {
  expect(
    findApplicationTestPaths([
      "src/a.mjs",
      "tests/a.test.mjs",
      "tests/helper.mjs",
      "tests/b.test.js",
      "tests/nested/c.test.mjs",
    ]),
  ).toEqual(["tests/a.test.mjs", "tests/nested/c.test.mjs"]);
});
