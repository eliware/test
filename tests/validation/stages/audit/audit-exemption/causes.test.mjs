import { expect, test } from "@jest/globals";
import areSevereAuditFindingsExempt from "../../../../../src/validation/stages/audit/audit-exemption/causes.mjs";
test("accepts findings linked to an allowed advisory", () => {
  expect(
    areSevereAuditFindingsExempt(
      {
        issue: {
          severity: "high",
          via: [{ severity: "high", url: "https://e.test/GHSA-abcd-efgh-ijkl" }],
        },
      },
      new Set(["ghsa-abcd-efgh-ijkl"]),
    ),
  ).toBe(true);
});
test("rejects severe findings with unresolved causes", () => {
  expect(
    areSevereAuditFindingsExempt({ issue: { severity: "high", via: ["missing"] } }, new Set()),
  ).toBe(false);
});
