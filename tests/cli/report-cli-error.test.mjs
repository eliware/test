import { expect, jest, test } from "@jest/globals";
import { reportCliError } from "../../src/cli/report-cli-error.mjs";

test("reports a normalized error and returns its exit code", () => {
  const write = jest.fn();
  expect(reportCliError(new Error("validation failed"), write)).toBe(1);
  expect(write).toHaveBeenCalledTimes(2);
  expect(write.mock.calls.at(-1)[0]).toContain("Exit-code: 1");
});
