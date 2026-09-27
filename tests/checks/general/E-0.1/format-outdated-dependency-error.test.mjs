import { expect, test } from "@jest/globals";
import { formatOutdatedDependencyError } from "../../../../src/checks/general/E-0.1/format-outdated-dependency-error.mjs";

test("redacts secrets and bounds outdated dependency errors", () => {
  expect(formatOutdatedDependencyError(new Error("registry unavailable"))).toBe(
    "registry unavailable",
  );
  expect(formatOutdatedDependencyError(new Error("failed private-token-value"), {
    API_TOKEN: "private-token-value",
  })).toBe("failed [REDACTED]");
  expect(formatOutdatedDependencyError(new Error("x".repeat(1_200)), {})).toHaveLength(1_000);
  expect(formatOutdatedDependencyError({ message: "failure" }, {})).toBe("[object Object]");
  expect(formatOutdatedDependencyError(null, {})).toBe("unknown registry lookup error");
});
