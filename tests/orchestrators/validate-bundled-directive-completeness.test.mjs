import { expect, test } from "@jest/globals";
import { validateBundledDirectiveCompleteness } from "../../src/orchestrators/validate-bundled-directive-completeness.mjs";

const check = (ruleId, enforcementMode = "deterministic", profile = "general") => ({
  ruleId,
  enforcementMode,
  modulePath: `${profile}/${ruleId}.mjs`,
});
const catalog = {
  version: "9.0",
  profiles: {
    general: { profile: "general", document: "general.json", version: "9.0", extends: [] },
    application: {
      profile: "application",
      document: "application.json",
      version: "9.0",
      extends: [],
    },
  },
  directives: { "E-0.1": "general", "A-0.1.1": "general", "E-0.1.130.7": "application" },
  rules: {
    "E-0.1": { id: "E-0.1", dos: ["Do E-0.1."], donts: ["Don't E-0.1."] },
    "A-0.1.1": { id: "A-0.1.1", dos: ["Do A-0.1.1."], donts: ["Don't A-0.1.1."] },
    "E-0.1.130.7": {
      id: "E-0.1.130.7",
      dos: ["Do E-0.1.130.7."],
      donts: ["Don't E-0.1.130.7."],
    },
  },
};

test("accepts every registered bundled directive", async () => {
  expect(
    validateBundledDirectiveCompleteness([check("E-0.1"), check("A-0.1.1")], ["general"], catalog),
  ).toBe(true);
});

test("fails when the bundled catalog is not v9", async () => {
  expect(() =>
    validateBundledDirectiveCompleteness([], ["general"], { version: "7.0", profiles: {} }),
  ).toThrow("missing or invalid");
});

test("handles an applied group without an catalog entry", () => {
  expect(() =>
    validateBundledDirectiveCompleteness([], ["unlisted"], {
      version: "9.0",
      profiles: {},
      directives: {},
      rules: {},
    }),
  ).toThrow("Unknown bundled convention profiles");
});

test("rejects a catalog without profiles", () => {
  expect(() => validateBundledDirectiveCompleteness([], [], { version: "9.0" })).toThrow(
    "missing or invalid",
  );
});

test("uses the bundled catalog by default", () => {
  expect(validateBundledDirectiveCompleteness([], [])).toBe(true);
});

test("keeps catalog validation separate from deterministic enforcement status", () => {
  expect(
    validateBundledDirectiveCompleteness(
      [
        {
          ...check("E-0.1.130.7", "non-deterministic", "application"),
          applicability: "advisory-only",
        },
      ],
      ["general"],
      catalog,
    ),
  ).toBe(true);
});

test("rejects an invalid enforcement mode instead of treating it as an implemented check", () => {
  expect(() =>
    validateBundledDirectiveCompleteness([check("E-0.1", "unknown")], ["general"], catalog),
  ).toThrow("valid enforcement mode");
});

test("rejects a deterministic check whose identity disagrees with its module path", () => {
  expect(() =>
    validateBundledDirectiveCompleteness(
      [{ ...check("E-9"), modulePath: "general/E-0.1.mjs" }],
      ["general"],
      catalog,
    ),
  ).toThrow("no matching catalog entry");
});

test("rejects a check ID that is absent from the local convention specifications", () => {
  expect(() =>
    validateBundledDirectiveCompleteness([check("E-0.1.999")], ["general"], catalog),
  ).toThrow("general/E-0.1.999.mjs (E-0.1.999)");
});

test("rejects a canonical check placed under the wrong profile", () => {
  expect(() =>
    validateBundledDirectiveCompleteness(
      [check("E-0.1.130.7", "deterministic", "general")],
      ["general"],
      catalog,
    ),
  ).toThrow("general/E-0.1.130.7.mjs (E-0.1.130.7)");
});

test("rejects unknown check profiles even when that profile is not selected", () => {
  expect(() =>
    validateBundledDirectiveCompleteness(
      [{ ...check("E-0.1"), modulePath: "unknown/E-0.1.mjs" }],
      ["general"],
      catalog,
    ),
  ).toThrow("unknown/E-0.1.mjs (E-0.1)");
});
