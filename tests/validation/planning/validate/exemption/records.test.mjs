import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { validateExemptionRecords } from "../../../../../src/validation/planning/validate/exemption/records.mjs";

beforeEach(() => jest.useFakeTimers({ now: new Date("2026-10-16T00:00:00Z") }));
afterEach(() => jest.useRealTimers());

const futureExpiry = () => "2026-11-15";

const record = (overrides = {}) => ({
  ruleId: "E-0.1.130.14",
  reason: "Temporary migration exception.",
  approver: "Eli",
  approvalTimestamp: "2026-09-13T00:00:00Z",
  expiry: futureExpiry(),
  ...overrides,
});

test("accepts valid temporary and permanent exemptions", () => {
  expect(() =>
    validateExemptionRecords([
      record({ review: "2026-09-20" }),
      record({ ruleId: "E-0.1.3", expiry: null }),
    ]),
  ).not.toThrow();
});

test("rejects malformed records and invalid expiry dates", () => {
  expect(() => validateExemptionRecords([record({ ruleId: " " })])).toThrow();
  expect(() => validateExemptionRecords([record({ reason: "" })])).toThrow();
  expect(() => validateExemptionRecords([record({ expiry: "not-a-date" })])).toThrow();
  expect(() => validateExemptionRecords([record({ approvalTimestamp: "" })])).toThrow();
  expect(() =>
    validateExemptionRecords([record({ approvalTimestamp: "not-a-timestamp" })]),
  ).toThrow();
  expect(() =>
    validateExemptionRecords([record({ approvalTimestamp: "January 1, 2026" })]),
  ).toThrow();
  expect(() =>
    validateExemptionRecords([record({ approvalTimestamp: "2026-02-30T00:00:00Z" })]),
  ).toThrow();
  expect(() => validateExemptionRecords([record({ expiry: "2020-01-01" })])).toThrow();
  expect(() => validateExemptionRecords([record({ expiry: "2026-02-30" })])).toThrow();
  expect(() =>
    validateExemptionRecords([record({ approvalTimestamp: "2026-10-16T25:00:00Z" })]),
  ).toThrow();
  expect(() =>
    validateExemptionRecords([record({ approvalTimestamp: "2026-10-16T00:00:00+99:99" })]),
  ).toThrow();
});

test("rejects duplicate exemption rule IDs", () => {
  expect(() =>
    validateExemptionRecords([record({ review: "2026-09-20" }), record({ review: "2026-09-20" })]),
  ).toThrow("must be unique");
});

test("rejects unknown rule IDs when the caller supplies known IDs", () => {
  expect(() => validateExemptionRecords([record()], ["E-0.1"])).toThrow("known rule ID");
});

test.each(["random-user", "eli", "Eliware", ""])("rejects non-Eli approver %j", (approver) => {
  expect(() => validateExemptionRecords([record({ approver })])).toThrow();
});

test("accepts temporary exemptions without non-contract review metadata", () => {
  expect(() => validateExemptionRecords([record()])).not.toThrow();
  expect(() => validateExemptionRecords([record({ review: "2026-10-01" })])).not.toThrow();
  expect(() =>
    validateExemptionRecords([record({ expiry: null, review: "2026-09-20" })]),
  ).not.toThrow();
});

test("accepts exact and wildcard repository-relative path exemptions", () => {
  expect(() => validateExemptionRecords([record({ paths: [] })])).not.toThrow();
  expect(() =>
    validateExemptionRecords([
      record({ paths: ["docs/vendor/file.yaml", "secrets/**", "infrastructure/**/secrets/*"] }),
    ]),
  ).not.toThrow();
});

test("accepts advisory-scoped audit exemptions", () => {
  expect(() =>
    validateExemptionRecords([
      record({
        ruleId: "stage:audit",
        advisories: ["GHSA-fc5q-39xc-vjpf"],
      }),
    ]),
  ).not.toThrow();
});

test.each([
  {},
  { advisories: [] },
  { advisories: ["CVE-2026-1234"] },
  { advisories: ["GHSA-fc5q-39xc-vjpf", "GHSA-fc5q-39xc-vjpf"] },
  { advisories: ["GHSA-fc5q-39xc-vjpf"], paths: ["src/**"] },
])("rejects invalid audit exemptions %j", (extra) => {
  expect(() => validateExemptionRecords([record({ ruleId: "stage:audit", ...extra })])).toThrow();
});

test("rejects audit advisory IDs on convention exemptions", () => {
  expect(() =>
    validateExemptionRecords([record({ advisories: ["GHSA-fc5q-39xc-vjpf"] })]),
  ).toThrow();
});

test.each([
  null,
  "docs/file.yaml",
  [null],
  [""],
  ["/docs/file.yaml"],
  ["C:/docs/file.yaml"],
  ["docs\\file.yaml"],
  ["docs//file.yaml"],
  ["docs/"],
  ["./docs/file.yaml"],
  ["docs/../file.yaml"],
  ["docs/file.yaml", "docs/file.yaml"],
])("rejects invalid exemption paths %j", (paths) => {
  expect(() => validateExemptionRecords([record({ paths })])).toThrow();
});
