import { expect, test } from "@jest/globals";
import { validateProtectedIgnoreNegations } from "../../../../../../src/checks/general/E-0.1.0.1.8/validate/ignore-patterns/validate-protected-negations.mjs";

test("accepts negations that do not restore protected paths", () => {
  expect(validateProtectedIgnoreNegations(["node_modules/", "!local-example.txt"])).toBeNull();
});

test("reports negations that restore protected paths", () => {
  expect(validateProtectedIgnoreNegations(["coverage/", "!nested/coverage/"])).toBe(
    ".gitignore must not restore protected paths with negation rules: !nested/coverage/.",
  );
});
