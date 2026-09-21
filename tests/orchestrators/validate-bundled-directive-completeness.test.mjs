import { expect, test } from "@jest/globals";
import { validateBundledDirectiveCompleteness } from "../../src/orchestrators/validate-bundled-directive-completeness.mjs";

const check = (ruleId, enforcementMode = "deterministic") => ({ ruleId, enforcementMode, modulePath: `general/${ruleId}.mjs` });
const authority = { version: "8.0", profiles: { general: { profile: "general", document: "general.json", version: "8.0", extends: [] } } };

test("accepts every authoritative bundled directive", async () => {
  expect(validateBundledDirectiveCompleteness([check("E-1"), check("A-1.1")], ["general"], authority)).toBe(true);
});

test("fails when the bundled authority is not v8", async () => {
  expect(() => validateBundledDirectiveCompleteness([], ["general"], { version: "7.0", profiles: {} })).toThrow("missing or invalid");
});

test("handles an applied group without an authority entry", () => {
  expect(() => validateBundledDirectiveCompleteness([], ["unlisted"], { version: "8.0", profiles: {} }))
    .toThrow("Unknown bundled convention profiles");
});

test("rejects an authority without profiles", () => {
  expect(() => validateBundledDirectiveCompleteness([], [], { version: "8.0" })).toThrow("missing or invalid");
});

test("uses the bundled authority by default", () => {
  expect(validateBundledDirectiveCompleteness([], [])).toBe(true);
});

test("does not require non-deterministic directives to have enforcement", () => {
  expect(validateBundledDirectiveCompleteness(
    [check("E-1.11", "non-deterministic")],
    ["general"],
    authority,
  )).toBe(true);
});

test("rejects an invalid enforcement mode instead of treating it as an implemented check", () => {
  expect(() => validateBundledDirectiveCompleteness(
    [check("E-1", "unknown")],
    ["general"],
    authority,
  )).toThrow("valid enforcement mode");
});
