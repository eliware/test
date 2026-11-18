import { expect, test } from "@jest/globals";
import auditFailureIsExempt from "../../../../src/validation/stages/audit/format-audit-failure.mjs";
const allowedAdvisory = "GHSA-fc5q-39xc-vjpf";

test("exempts high findings that trace only to an allowed advisory", () => {
  const value = {
    stdout: JSON.stringify({
      vulnerabilities: {
        parent: {
          severity: "high",
          via: ["picomatch", "moderate"],
        },
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
          via: [
            {
              severity: "moderate",
              url: "https://example.test/moderate",
            },
          ],
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
          via: [
            {
              severity: "high",
              url: "https://example.test/other",
            },
          ],
        },
      },
    }),
  };
  expect(auditFailureIsExempt(value, [allowedAdvisory])).toBe(false);
  expect(
    auditFailureIsExempt(
      {
        stdout: "not JSON",
      },
      [allowedAdvisory],
    ),
  ).toBe(false);
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: {},
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(false);
  expect(auditFailureIsExempt({}, [allowedAdvisory])).toBe(false);
  expect(auditFailureIsExempt({ stdout: "   " }, [allowedAdvisory])).toBe(false);
  expect(auditFailureIsExempt({ stdout: "null" }, [allowedAdvisory])).toBe(false);
});
test("does not exempt unresolved or cyclic high findings", () => {
  expect(
    auditFailureIsExempt(
      {
        stdout: JSON.stringify({
          vulnerabilities: {
            missing: {
              severity: "high",
              via: ["absent"],
            },
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
            first: {
              severity: "high",
              via: ["second"],
            },
            second: {
              severity: "high",
              via: ["first"],
            },
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
              via: [
                {
                  url: `https://github.com/advisories/${allowedAdvisory}`,
                },
              ],
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
      {
        stdout: JSON.stringify({
          vulnerabilities: {
            empty: {
              severity: "high",
              via: [],
            },
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
            invalid: {
              severity: "high",
              via: [4],
            },
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
              via: [
                {
                  severity: "moderate",
                },
              ],
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
            missingUrl: {
              severity: "high",
              via: [
                {
                  severity: "high",
                },
              ],
            },
          },
        }),
      },
      [allowedAdvisory],
    ),
  ).toBe(false);
});
