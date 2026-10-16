import { expect, test } from "@jest/globals";
import { validateEliwareSchema } from "../../../../../../src/checks/general/E-0.1.0.1.0/validate/eliware/schema.mjs";

const metadata = (approvalTimestamp, expiry) => ({
  id: "E-1",
  apply: ["general"],
  exempt: [
    {
      ruleId: "E-0.1.0.1.8",
      reason: "Keep approved files.",
      approver: "Eli",
      approvalTimestamp,
      expiry,
    },
  ],
});

test("accepts valid timestamps, timezone offsets, dates, and null expiry", () => {
  expect(validateEliwareSchema(metadata("2026-10-16T15:30:45Z", "2026-10-31"))).toEqual([]);
  expect(validateEliwareSchema(metadata("2026-10-16T15:30:45.123+05:30", null))).toEqual([]);
});

test.each([
  ["2026-99-77T99:99:99Z", null],
  ["2026-10-16T25:30:45Z", null],
  ["2026-10-16T15:30:45+99:99", null],
  ["2026-10-16T15:30:45Z", "2026-99-77"],
  ["2026-10-16T15:30:45Z", "2026-02-30"],
])("rejects invalid date metadata %j", (timestamp, expiry) => {
  expect(validateEliwareSchema(metadata(timestamp, expiry))).not.toEqual([]);
});
