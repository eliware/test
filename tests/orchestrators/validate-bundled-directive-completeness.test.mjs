import { expect, test } from "@jest/globals";
import { validateBundledDirectiveCompleteness } from "../../src/orchestrators/validate-bundled-directive-completeness.mjs";

const check = (ruleId, enforcementMode = "deterministic", profile = "general") => ({
  ruleId,
  enforcementMode,
  modulePath: `${profile}/${ruleId}.mjs`,
});
const authority = {
  version: "8.0",
  profiles: {
    general: { profile: "general", document: "general.json", version: "8.0", extends: [] },
    application: {
      profile: "application",
      document: "application.json",
      version: "8.0",
      extends: [],
    },
  },
  directives: { "E-1": "general", "A-1.1": "general", "E-1.130.7": "application" },
  rules: {
    "E-1": { id: "E-1", dos: ["Do E-1."], donts: ["Don't E-1."] },
    "A-1.1": { id: "A-1.1", dos: ["Do A-1.1."], donts: ["Don't A-1.1."] },
    "E-1.130.7": {
      id: "E-1.130.7",
      dos: ["Do E-1.130.7."],
      donts: ["Don't E-1.130.7."],
    },
  },
};

test("accepts every authoritative bundled directive", async () => {
  expect(
    validateBundledDirectiveCompleteness(
      [check("E-1"), check("A-1.1")],
      ["general"],
      authority,
    ),
  ).toBe(true);
});

test("fails when the bundled authority is not v8", async () => {
  expect(() =>
    validateBundledDirectiveCompleteness([], ["general"], { version: "7.0", profiles: {} }),
  ).toThrow("missing or invalid");
});

test("handles an applied group without an authority entry", () => {
  expect(() =>
    validateBundledDirectiveCompleteness([], ["unlisted"], {
      version: "8.0",
      profiles: {},
      directives: {},
      rules: {},
    }),
  ).toThrow("Unknown bundled convention profiles");
});

test("rejects an authority without profiles", () => {
  expect(() => validateBundledDirectiveCompleteness([], [], { version: "8.0" })).toThrow(
    "missing or invalid",
  );
});

test("uses the bundled authority by default", () => {
  expect(validateBundledDirectiveCompleteness([], [])).toBe(true);
});

test("keeps authority validation separate from deterministic enforcement status", () => {
  expect(
    validateBundledDirectiveCompleteness(
      [check("E-1.130.7", "non-deterministic", "application")],
      ["general"],
      authority,
    ),
  ).toBe(true);
});

test("rejects an invalid enforcement mode instead of treating it as an implemented check", () => {
  expect(() =>
    validateBundledDirectiveCompleteness([check("E-1", "unknown")], ["general"], authority),
  ).toThrow("valid enforcement mode");
});

test("rejects a deterministic check whose identity disagrees with its module path", () => {
  expect(() =>
    validateBundledDirectiveCompleteness(
      [{ ...check("E-9"), modulePath: "general/E-1.mjs" }],
      ["general"],
      authority,
    ),
  ).toThrow("no matching authority entry");
});

test("rejects a check ID that is absent from the local convention specifications", () => {
  expect(() =>
    validateBundledDirectiveCompleteness([check("E-1.999")], ["general"], authority),
  ).toThrow("general/E-1.999.mjs (E-1.999)");
});

test("rejects a canonical check placed under the wrong profile", () => {
  expect(() =>
    validateBundledDirectiveCompleteness(
      [check("E-1.130.7", "deterministic", "general")],
      ["general"],
      authority,
    ),
  ).toThrow("general/E-1.130.7.mjs (E-1.130.7)");
});

test("rejects unknown check profiles even when that profile is not selected", () => {
  expect(() =>
    validateBundledDirectiveCompleteness(
      [{ ...check("E-1"), modulePath: "unknown/E-1.mjs" }],
      ["general"],
      authority,
    ),
  ).toThrow("unknown/E-1.mjs (E-1)");
});
