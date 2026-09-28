import { expect, test } from "@jest/globals";
import { isSuccessfulNpmAuditReport } from "../../../../../src/checks/general/E-0.1/E-0.1.20/is-successful-npm-audit-report.mjs";

test("accepts reports with zero high and critical vulnerabilities", () => {
  const reportedVulnerabilities = Object.fromEntries(
    ["info", "info", "info", "low", "low", "moderate"].map((severity, index) => [
      `package-${index}`,
      { severity },
    ]),
  );
  expect(
    isSuccessfulNpmAuditReport(
      JSON.stringify({
        auditReportVersion: 2,
        vulnerabilities: reportedVulnerabilities,
        metadata: {
          vulnerabilities: { info: 3, low: 2, moderate: 1, high: 0, critical: 0, total: 6 },
        },
      }),
    ),
  ).toBe(true);
});

test("requires audit dependency metadata to cover the declared dependency count", () => {
  const report = {
    auditReportVersion: 2,
    vulnerabilities: {},
    metadata: {
      dependencies: { total: 1 },
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
    },
  };

  expect(isSuccessfulNpmAuditReport(JSON.stringify(report), 1)).toBe(true);
  expect(isSuccessfulNpmAuditReport(JSON.stringify(report), 2)).toBe(false);
  expect(
    isSuccessfulNpmAuditReport(
      JSON.stringify({ ...report, metadata: report.metadata.vulnerabilities }),
      1,
    ),
  ).toBe(false);
});

test("requires each declared dependency category in the audit report", () => {
  const report = {
    auditReportVersion: 2,
    vulnerabilities: {},
    metadata: {
      dependencies: { prod: 1, total: 1 },
      vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 },
    },
  };
  const requirements = { minimumDependencyCount: 1, categories: { prod: 1 } };

  expect(isSuccessfulNpmAuditReport(JSON.stringify(report), requirements)).toBe(true);
  expect(
    isSuccessfulNpmAuditReport(
      JSON.stringify({
        ...report,
        metadata: { ...report.metadata, dependencies: { prod: 0, total: 1 } },
      }),
      requirements,
    ),
  ).toBe(false);
  expect(
    isSuccessfulNpmAuditReport(
      JSON.stringify({ ...report, metadata: { ...report.metadata, dependencies: undefined } }),
      requirements,
    ),
  ).toBe(false);
});

test("rejects malformed JSON and non-object reports", () => {
  for (const report of ["not json", "null", "[]", '"report"']) {
    expect(isSuccessfulNpmAuditReport(report)).toBe(false);
  }
});

test("requires the npm audit v2 report structure even when metadata counts are clean", () => {
  const valid = {
    auditReportVersion: 2,
    vulnerabilities: {},
    metadata: { vulnerabilities: { high: 0, critical: 0 } },
  };
  for (const report of [
    { ...valid, auditReportVersion: undefined },
    { ...valid, vulnerabilities: undefined },
    { ...valid, vulnerabilities: [] },
    { ...valid, vulnerabilities: null },
    { ...valid, vulnerabilities: "invalid" },
  ]) {
    expect(isSuccessfulNpmAuditReport(JSON.stringify(report))).toBe(false);
  }
});

test("rejects missing or malformed metadata vulnerability counts", () => {
  for (const vulnerabilities of [undefined, null, [], "invalid"]) {
    expect(
      isSuccessfulNpmAuditReport(
        JSON.stringify({
          auditReportVersion: 2,
          vulnerabilities: {},
          metadata: { vulnerabilities },
        }),
      ),
    ).toBe(false);
  }
});
