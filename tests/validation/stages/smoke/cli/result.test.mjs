import { expect, jest, test } from "@jest/globals";
import writeSmokeCliResult from "../../../../../src/validation/stages/smoke/cli/result.mjs";

test("writes smoke results and returns the matching code", () => {
  const write = jest.fn();
  expect(writeSmokeCliResult("Smoke passed: package installed", write)).toBe(0);
  expect(writeSmokeCliResult("Smoke failed: npm test", write)).toBe(17);
  expect(write).toHaveBeenNthCalledWith(1, "Smoke passed: package installed");
  expect(write).toHaveBeenNthCalledWith(2, "Smoke failed: npm test");
});

test("reports a command error with the smoke failure code", () => {
  const write = jest.fn();
  expect(writeSmokeCliResult(new Error("install failed"), write)).toBe(17);
  expect(write).toHaveBeenCalledWith("Tarball consumer smoke failed: install failed");
});
