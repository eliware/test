import { expect, test } from "@jest/globals";
import {
  formatConventionFailure,
  selectRemediation,
  validateRemediationCoverage,
} from "../../src/orchestrators/convention-remediation.mjs";

const guidance = {
  version: "8.0",
  checks: {
    "E-1.1.0": {
      dos: [
        "Use the canonical README heading order.",
        "Include each package description, author, and license value verbatim in README.md.",
      ],
    },
  },
};

test("selects remediation guidance relevant to the actual diagnostic", () => {
  expect(
    selectRemediation(
      "E-1.1.0",
      "README.md is missing package author and license metadata",
      guidance,
    ),
  ).toEqual(["Include each package description, author, and license value verbatim in README.md."]);
});

test("falls back to the first directive when a diagnostic has no meaningful matching words", () => {
  expect(selectRemediation("E-1.1.0", "### $$$", guidance)).toEqual([
    "Use the canonical README heading order.",
  ]);
});

test("returns no guidance for an unknown check or empty directive list", () => {
  expect(selectRemediation("E-9", "failure", guidance)).toEqual([]);
  expect(selectRemediation("E-1.1.0", "failure", { checks: { "E-1.1.0": { dos: [] } } })).toEqual(
    [],
  );
});

test("uses the bundled guidance and empty-message defaults", () => {
  expect(selectRemediation("E-1.1")).toEqual(
    expect.arrayContaining([expect.stringContaining("Features")]),
  );
});

test("keeps equally relevant fixes in their authoritative order", () => {
  const tiedGuidance = {
    version: "8.0",
    checks: {
      "E-1": {
        dos: [
          "Correct the README package metadata.",
          "Update the README package metadata.",
          "Fix unrelated CI workflow.",
        ],
      },
    },
  };
  expect(selectRemediation("E-1", "README package metadata", tiedGuidance)).toEqual([
    "Correct the README package metadata.",
    "Update the README package metadata.",
  ]);
});

test("includes remediation guidance alongside every failed-check diagnostic", () => {
  expect(
    formatConventionFailure(
      {
        ruleId: "E-1.1.0",
        message: "README.md is missing package author and license metadata",
      },
      guidance,
    ),
  ).toBe(
    "E-1.1.0: README.md is missing package author and license metadata\n  How to resolve: Include each package description, author, and license value verbatim in README.md.",
  );
});

test("reports missing guidance as a bundled-authority maintenance error", () => {
  expect(formatConventionFailure({ ruleId: "E-9", message: "failed" }, guidance)).toContain(
    "Update the bundled Convention v8.0 remediation snapshot",
  );
});

test("uses the bundled guidance by default and handles a missing diagnostic", () => {
  expect(formatConventionFailure({ ruleId: "E-1.1" })).toContain(
    "The check failed without a diagnostic.",
  );
  expect(formatConventionFailure({ ruleId: "E-1.1", message: "failed" })).toContain(
    "How to resolve:",
  );
});

test("validates remediation coverage for all discovered checks", () => {
  expect(validateRemediationCoverage([{ ruleId: "E-1.1.0" }], guidance)).toBe(true);
  expect(() => validateRemediationCoverage([{ ruleId: "E-9" }], guidance)).toThrow(
    "Bundled checks lack remediation guidance: E-9",
  );
  expect(validateRemediationCoverage([])).toBe(true);
  expect(() =>
    validateRemediationCoverage([{ ruleId: "E-9" }], {
      version: "8.0",
      checks: { "E-9": { dos: "not an array" } },
    }),
  ).toThrow("Bundled checks lack remediation guidance: E-9");
  expect(() => validateRemediationCoverage([], { version: "7.0", checks: {} })).toThrow(
    "must match Convention v8.0",
  );
});
