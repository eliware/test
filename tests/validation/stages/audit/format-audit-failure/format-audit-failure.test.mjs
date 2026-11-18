import { expect, test } from "@jest/globals";
import formatAuditFailure from "../../../../../src/validation/stages/audit/format-audit-failure/format-audit-failure.mjs";
test("summarizes audit severity counts and unique advisories", () => {
  expect(
    formatAuditFailure({
      stdout: JSON.stringify({
        metadata: {
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 1,
            high: 2,
            critical: 0,
            total: 3,
          },
        },
        vulnerabilities: {
          alpha: {
            name: "alpha",
            severity: "high",
            via: [
              {
                source: 123,
                title: "Example issue",
                severity: "high",
                range: "<2",
                url: "https://example.test/advisory",
              },
            ],
          },
          beta: {
            name: "beta",
            severity: "high",
            via: [
              {
                source: 123,
                title: "Example issue",
                severity: "high",
                range: "<2",
                url: "https://example.test/advisory",
              },
            ],
          },
        },
      }),
    }),
  ).toBe(
    "npm audit found 3 vulnerabilities (1 moderate, 2 high).\nhigh: Example issue. Affected versions: <2. Affected packages: alpha, beta. https://example.test/advisory",
  );
});
test("falls back to the captured npm output when the report is not JSON", () => {
  expect(
    formatAuditFailure({
      stdout: "plain output",
      stderr: "audit detail",
    }),
  ).toBe("audit detail\nplain output");
});
test("reports when npm supplied no failure details", () => {
  expect(
    formatAuditFailure({
      stdout: "",
      stderr: "",
    }),
  ).toBe("npm returned no audit details. Run npm audit --json for the report.");
});
test("handles incomplete JSON reports and advisory entries", () => {
  expect(
    formatAuditFailure({
      stdout: "not JSON",
      stderr: "",
    }),
  ).toBe("not JSON");
  expect(
    formatAuditFailure({
      stdout: "null",
      stderr: "",
    }),
  ).toBe("null");
  expect(
    formatAuditFailure({
      stdout: JSON.stringify({
        metadata: {
          vulnerabilities: {},
        },
        vulnerabilities: {
          noAdvisories: {},
        },
      }),
    }),
  ).toBe("npm audit found unknown vulnerabilities.");
  expect(
    formatAuditFailure({
      stdout: JSON.stringify({
        metadata: {
          vulnerabilities: {},
        },
      }),
    }),
  ).toBe("npm audit found unknown vulnerabilities.");
  expect(
    formatAuditFailure({
      stdout: JSON.stringify({
        metadata: {
          vulnerabilities: {},
        },
        vulnerabilities: {
          ignoredNull: null,
          ignoredNumber: 2,
          byUrl: {
            via: [
              null,
              "string",
              {},
              {
                title: "URL keyed issue",
                url: "https://example.test/url",
              },
            ],
          },
          byTitle: {
            via: [
              {
                title: "Title keyed issue",
              },
            ],
          },
          bySource: {
            name: "source-package",
            via: [
              {
                source: 456,
                title: "Moderate issue",
                severity: "moderate",
                range: "<3",
                url: "https://example.test/source",
              },
              {
                source: 456,
                title: "Duplicate issue detail",
                severity: "high",
              },
            ],
          },
        },
      }),
    }),
  ).toBe(
    "npm audit found unknown vulnerabilities.\nunknown: URL keyed issue. https://example.test/url\nunknown: Title keyed issue.\nmoderate: Moderate issue. Affected versions: <3. Affected packages: source-package. https://example.test/source",
  );
});
