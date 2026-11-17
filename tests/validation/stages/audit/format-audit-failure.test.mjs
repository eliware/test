import { expect, test } from "@jest/globals";
import {
  auditFailureIsExempt,
  formatAuditFailure,
} from "../../../../src/validation/stages/audit/format-audit-failure.mjs";

const allowedAdvisory = "GHSA-fc5q-39xc-vjpf";

test("summarizes audit severity counts and unique advisories", () => {
  expect(
    formatAuditFailure({
      stdout: JSON.stringify({
        metadata: {
          vulnerabilities: { info: 0, low: 0, moderate: 1, high: 2, critical: 0, total: 3 },
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
  expect(formatAuditFailure({ stdout: "plain output", stderr: "audit detail" })).toBe(
    "audit detail\nplain output",
  );
});

test("reports when npm supplied no failure details", () => {
  expect(formatAuditFailure({ stdout: "", stderr: "" })).toBe(
    "npm returned no audit details. Run npm audit --json for the report.",
  );
});

test("handles incomplete JSON reports and advisory entries", () => {
  expect(formatAuditFailure({ stdout: "not JSON", stderr: "" })).toBe("not JSON");
  expect(formatAuditFailure({ stdout: "null", stderr: "" })).toBe("null");
  expect(
    formatAuditFailure({
      stdout: JSON.stringify({
        metadata: { vulnerabilities: {} },
        vulnerabilities: { noAdvisories: {} },
      }),
    }),
  ).toBe("npm audit found unknown vulnerabilities.");
  expect(
    formatAuditFailure({ stdout: JSON.stringify({ metadata: { vulnerabilities: {} } }) }),
  ).toBe("npm audit found unknown vulnerabilities.");
  expect(
    formatAuditFailure({
      stdout: JSON.stringify({
        metadata: { vulnerabilities: {} },
        vulnerabilities: {
          ignoredNull: null,
          ignoredNumber: 2,
          byUrl: {
            via: [
              null,
              "string",
              {},
              { title: "URL keyed issue", url: "https://example.test/url" },
            ],
          },
          byTitle: {
            via: [{ title: "Title keyed issue" }],
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

test("exempts high findings that trace only to an allowed advisory", () => {
  const value = {
    stdout: JSON.stringify({
      vulnerabilities: {
        parent: { severity: "high", via: ["picomatch", "moderate"] },
        picomatch: {
          severity: "high",
          via: [
            {
              severity: "high",
              url: `https://github.com/advisories/${allowedAdvisory}`,
            },
          ],
        },
        moderate: {
          severity: "moderate",
          via: [{ severity: "moderate", url: "https://example.test/moderate" }],
        },
      },
    }),
  };
  expect(auditFailureIsExempt(value, [allowedAdvisory])).toBe(true);
  expect(auditFailureIsExempt(value, [])).toBe(false);
  expect(auditFailureIsExempt(value, ["GHSA-aaaa-bbbb-cccc"])).toBe(false);
  expect(auditFailureIsExempt(value)).toBe(false);
});

test("does not exempt another high advisory or malformed audit output", () => {
  const value = {
    stdout: JSON.stringify({
      vulnerabilities: {
        picomatch: {
          severity: "high",
          via: [{ severity: "high", url: "https://example.test/other" }],
        },
      },
    }),
  };
  expect(auditFailureIsExempt(value, [allowedAdvisory])).toBe(false);
  expect(auditFailureIsExempt({ stdout: "not JSON" }, [allowedAdvisory])).toBe(false);
  expect(
    auditFailureIsExempt({ stdout: JSON.stringify({ vulnerabilities: {} }) }, [allowedAdvisory]),
  ).toBe(false);
});

test("does not exempt unresolved or cyclic high findings", () => {
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: { missing: { severity: "high", via: ["absent"] } },
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(false);
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: {
            first: { severity: "high", via: ["second"] },
            second: { severity: "high", via: ["first"] },
          },
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(false);
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: {
            fallbackSeverity: {
              severity: "high",
              via: [{ url: `https://github.com/advisories/${allowedAdvisory}` }],
            },
          },
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(true);
});

test("rejects severe findings without causes and invalid cause entries", () => {
  expect(
    auditFailureIsExempt(
      { stdout: JSON.stringify({ vulnerabilities: { empty: { severity: "high", via: [] } } }) },
      [allowedAdvisory],
    ),
  ).toBe(false);
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: {
            invalid: { severity: "high", via: [4] },
          },
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(false);
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: {
            moderateCause: {
              severity: "high",
              via: [{ severity: "moderate" }],
            },
          },
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(true);
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: {
            missingUrl: { severity: "high", via: [{ severity: "high" }] },
          },
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(false);
});
