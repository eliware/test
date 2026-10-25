import { expect, jest, test } from "@jest/globals";
import { findCommonJsSourceUses } from "../../../../src/checks/general/E-0.1.0.1.1/source-commonjs-uses.mjs";

test("returns CommonJS findings from the repository scan", async () => {
  const scan = jest.fn(async () => ["entry.mjs: require()"]);
  await expect(findCommonJsSourceUses("/repo", ["entry.mjs"], null, scan)).resolves.toEqual([
    "entry.mjs: require()",
  ]);
  expect(scan).toHaveBeenCalledWith("/repo", ["entry.mjs"], null);
});

test("reports scan errors as repository inspection failures", async () => {
  const scan = jest.fn(async () => {
    throw new Error("inventory unavailable");
  });
  await expect(findCommonJsSourceUses("/repo", undefined, null, scan)).resolves.toEqual([
    "Repository modules could not be inspected for native ESM: inventory unavailable",
  ]);
});
