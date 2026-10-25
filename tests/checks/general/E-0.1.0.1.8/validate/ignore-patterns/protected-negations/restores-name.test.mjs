import { expect, test } from "@jest/globals";
import { restoresProtectedName } from "../../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns/protected-negations/restores-name.mjs";

test("requires a protected-name negation to follow its universal ignore", () => {
  const rules = ["coverage/", "!nested/coverage/"];
  expect(restoresProtectedName(rules, 1, "coverage")).toBe(true);
  expect(restoresProtectedName(["!nested/coverage/", "coverage/"], 0, "coverage")).toBe(false);
});
