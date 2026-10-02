import { expect, test } from "@jest/globals";
import { hasConsistentNpmAuditSeverityCounts } from "../../../../../src/checks/general/E-0.1/E-0.1.20/has-consistent-npm-audit-severity-counts.mjs";

const emptyCounts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
const report = (vulnerabilities, findings = {}) => ({
  vulnerabilities: findings,
  metadata: { vulnerabilities },
});

test("accepts counts that exactly match allowed vulnerability findings", () => {
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, info: 1, low: 1, moderate: 1, total: 3 },
        {
          info: { name: "info", severity: "info" },
          low: { name: "low", severity: "low" },
          moderate: { name: "moderate", severity: "moderate" },
        },
      ),
    ),
  ).toBe(true);
  expect(hasConsistentNpmAuditSeverityCounts(report(emptyCounts))).toBe(true);
});

test("counts advisory records in a package finding and rejects package aliases", () => {
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, moderate: 1, total: 1 },
        { example: { name: "example", severity: "moderate", via: [{ source: 1 }, { source: 2 }] } },
      ),
    ),
  ).toBe(true);
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, moderate: 1, total: 1 },
        {
          example: { name: "example", severity: "moderate" },
          duplicate: { name: "example", severity: "moderate" },
        },
      ),
    ),
  ).toBe(false);
});

test("rejects conflicting duplicate normalized package findings", () => {
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, low: 1, moderate: 1, total: 2 },
        {
          example: { name: "example", severity: "low", via: [{ source: 1 }] },
          duplicate: { name: "example", severity: "moderate", via: [{ source: 2 }] },
        },
      ),
    ),
  ).toBe(false);
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, moderate: 1, total: 1 },
        {
          example: { severity: "moderate" },
          duplicate: { severity: "moderate" },
        },
      ),
    ),
  ).toBe(false);
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, moderate: 2, total: 2 },
        {
          example: { severity: "moderate" },
          duplicate: { severity: "moderate" },
        },
      ),
    ),
  ).toBe(false);
});

test("rejects unnamed findings even when metadata matches their entry count", () => {
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report({ ...emptyCounts, moderate: 1, total: 1 }, { example: { severity: "moderate" } }),
    ),
  ).toBe(false);
});

test("rejects missing, malformed, or unsafe severity counts", () => {
  for (const counts of [
    { ...emptyCounts, high: undefined },
    { ...emptyCounts, low: -1 },
    { ...emptyCounts, moderate: 1.5 },
    { ...emptyCounts, info: Number.MAX_SAFE_INTEGER + 1 },
    { ...emptyCounts, total: undefined },
  ]) {
    expect(hasConsistentNpmAuditSeverityCounts(report(counts))).toBe(false);
  }
});

test("rejects severity counts whose sum is outside the safe integer range", () => {
  const maximum = Number.MAX_SAFE_INTEGER;
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report({ ...emptyCounts, info: maximum, low: maximum, total: maximum + maximum }),
    ),
  ).toBe(false);
});

test("accepts valid high and critical counts as structurally consistent", () => {
  for (const severity of ["high", "critical"]) {
    expect(
      hasConsistentNpmAuditSeverityCounts(
        report(
          { ...emptyCounts, [severity]: 1, total: 1 },
          {
            example: { name: "example", severity },
          },
        ),
      ),
    ).toBe(true);
  }
});

test("rejects missing finding severities and count mismatches", () => {
  for (const finding of [
    { name: "example", severity: undefined },
    { name: "example", severity: "low" },
    null,
    [],
  ]) {
    expect(hasConsistentNpmAuditSeverityCounts(report(emptyCounts, { example: finding }))).toBe(
      false,
    );
  }
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, moderate: 1, total: 1 },
        { example: { name: "example", severity: "moderate" } },
      ),
    ),
  ).toBe(true);
  expect(
    hasConsistentNpmAuditSeverityCounts(
      report(
        { ...emptyCounts, moderate: 1, total: 2 },
        { example: { name: "example", severity: "moderate" } },
      ),
    ),
  ).toBe(false);
});
