import { expect, test } from "@jest/globals";
import isJestPackageInstalled from "../../../../../../../../src/validation/stages/jest/configuration/resolve/jest/resolve/package.mjs";
test("reports whether the consumer can resolve the package", () => {
  expect(isJestPackageInstalled({ resolve: () => "jest" }, "jest")).toBe(true);
  expect(
    isJestPackageInstalled(
      {
        resolve() {
          throw Object.assign(new Error("Cannot find module 'jest'"), { code: "MODULE_NOT_FOUND" });
        },
      },
      "jest",
    ),
  ).toBe(false);
});
test("rethrows unrelated resolution errors", () => {
  const failure = new Error("resolver failed");
  expect(() =>
    isJestPackageInstalled(
      {
        resolve: () => {
          throw failure;
        },
      },
      "jest",
    ),
  ).toThrow(failure);
});
