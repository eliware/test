import { expect, test } from "@jest/globals";
import { readCanonicalOrder } from "../../../../src/validation/shared/conventions/read-canonical-order.mjs";
import { readProfileCombinationPolicy } from "../../../../src/validation/planning/read/profile-combination-policy.mjs";
import { validateAppliedProfiles } from "../../../../src/validation/planning/validate/applied-profiles.mjs";

const policy = readProfileCombinationPolicy();
const order = readCanonicalOrder("eliware-apply.yaml").profiles;

function canonical(names) {
  return [...new Set(names)].sort((left, right) => order.indexOf(left) - order.indexOf(right));
}

function validate(apply) {
  return validateAppliedProfiles(apply, policy, order);
}

function requiredClosure(names) {
  const selected = new Set(names);
  let changed = true;
  while (changed) {
    changed = false;
    for (const profile of selected) {
      for (const required of policy.profiles[profile]?.requires ?? []) {
        if (!selected.has(required)) {
          selected.add(required);
          changed = true;
        }
      }
      const alternatives = policy.profiles[profile]?.requiresAny ?? [];
      if (alternatives.length > 0 && !alternatives.some((name) => selected.has(name))) {
        selected.add(alternatives[0]);
        changed = true;
      }
    }
  }
  return canonical(selected);
}

test("requires general as a separate planning invariant", () => {
  expect(validate(["application"])).toContain("explicitly apply general");
  expect(validate(["general"])).toBeNull();
  expect(validateAppliedProfiles(["general"], policy)).toBeNull();
});

test("keeps profile order separate from profile combination policy", () => {
  expect(validate(["general", "application", "cli"])).toBeNull();
  expect(validate(["general", "cli", "application"])).toContain("canonical order");
});

test("rejects unknown profiles", () => {
  expect(validate(["general", "unknown"])).toBe("Unknown convention group: unknown.");
});

test("requires every profile listed in the central policy", () => {
  const failures = [];
  for (const [profile, values] of Object.entries(policy.profiles)) {
    for (const required of values.requires) {
      const selected = requiredClosure([profile]).filter((name) => name !== required);
      if (!validate(selected)?.includes(required)) failures.push(`${profile} requires ${required}`);
    }
  }
  expect(failures).toEqual([]);
});

test("requires application or library with npm-published", () => {
  expect(validate(["general", "npm-published"])).toContain("at least one of: application, library");
  expect(validate(["general", "application", "npm-published"])).toBeNull();
  expect(validate(["general", "library", "npm-published"])).toBeNull();
});

test("accepts empty requiresAny lists without added requirements", () => {
  expect(validate(["general"])).toBeNull();
  expect(validate(["general", "application"])).toBeNull();
});

test("rejects every prohibited profile combination", () => {
  const failures = [];
  for (const [profile, values] of Object.entries(policy.profiles)) {
    for (const prohibited of values.prohibits) {
      const selected = requiredClosure([profile, prohibited]);
      if (!validate(selected)?.includes("conflict"))
        failures.push(`${profile} prohibits ${prohibited}`);
    }
  }
  expect(failures).toEqual([]);
});

test("rejects library and private in either profile order", () => {
  const libraryFirst = ["general", "library", "private", "npm-published"];
  const privateFirst = ["general", "private", "npm-published", "library"];

  expect(validateAppliedProfiles(libraryFirst, policy, libraryFirst)).toContain("conflict");
  expect(validateAppliedProfiles(privateFirst, policy, privateFirst)).toContain("conflict");
});

test("allows application child profiles to combine", () => {
  expect(
    validate(
      canonical(["general", "application", "cli", "web", "discord", "mcp-server", "database"]),
    ),
  ).toBeNull();
});

test("allows GHCR publication without application and with private", () => {
  expect(validate(["general", "ghcr-published"])).toBeNull();
  expect(validate(["general", "ghcr-published", "private"])).toBeNull();
  expect(validate(["general", "application", "ghcr-published", "private"])).toBeNull();
});
