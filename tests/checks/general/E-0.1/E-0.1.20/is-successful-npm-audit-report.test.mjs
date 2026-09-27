import { expect, test } from "@jest/globals";
import { isSuccessfulNpmAuditReport } from "../../../../../src/checks/general/E-0.1/E-0.1.20/is-successful-npm-audit-report.mjs";

test("accepts reports with zero high and critical vulnerabilities", () => {
  expect(
    isSuccessfulNpmAuditReport(
      JSON.stringify({
        auditReportVersion: 2,
        vulnerabilities: {},
        metadata: {
          vulnerabilities: { info: 3, low: 2, moderate: 1, high: 0, critical: 0, total: 6 },
        },
      }),
    ),
  ).toBe(true);
});

test("rejects malformed JSON and non-object reports", () => {
  for (const report of ["not json", "null", "[]", '"report"']) {
    expect(isSuccessfulNpmAuditReport(report)).toBe(false);
  }
});

test("rejects missing or malformed metadata vulnerability counts", () => {
  for (const vulnerabilities of [undefined, null, [], "invalid"]) {
    expect(isSuccessfulNpmAuditReport(JSON.stringify({ metadata: { vulnerabilities } }))).toBe(
      false,
    );
  }
});

test("requires integer zero values for both protected severity counts", () => {
  for (const vulnerabilities of [
    {},
    { high: 0 },
    { critical: 0 },
    { high: 1, critical: 0 },
    { high: 0, critical: 1 },
    { high: "0", critical: 0 },
  ]) {
    expect(isSuccessfulNpmAuditReport(JSON.stringify({ metadata: { vulnerabilities } }))).toBe(
      false,
    );
  }
});
