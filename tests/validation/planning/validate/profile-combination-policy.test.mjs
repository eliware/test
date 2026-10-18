import { expect, test } from "@jest/globals";
import { bundledConventionVersion } from "../../../../src/validation/check-discovery/read/bundled-profile-catalog.mjs";
import { validateProfileCombinationPolicy } from "../../../../src/validation/planning/validate/profile-combination-policy.mjs";

const profiles = {
  general: { requires: [], requiresAny: [], prohibits: [] },
  application: { requires: ["general"], requiresAny: [], prohibits: [] },
};
const policy = { version: bundledConventionVersion, profiles };

test("accepts a complete policy for every known profile", () => {
  expect(
    validateProfileCombinationPolicy(policy, Object.keys(profiles), bundledConventionVersion),
  ).toEqual([]);
});

test("requires every known profile and rejects unknown names", () => {
  const altered = { ...policy, profiles: { general: profiles.general, extra: profiles.general } };
  const errors = validateProfileCombinationPolicy(
    altered,
    Object.keys(profiles),
    bundledConventionVersion,
  );
  expect(errors.join(" ")).toContain("omits profiles: application");
  expect(errors.join(" ")).toContain("unknown profiles: extra");
});

test("rejects invalid, duplicate, unknown, and self-referencing profile lists", () => {
  const altered = {
    version: bundledConventionVersion,
    profiles: {
      general: { requires: ["missing", "missing"], requiresAny: ["general"], prohibits: [] },
      application: { requires: [], requiresAny: [], prohibits: [] },
    },
  };
  const errors = validateProfileCombinationPolicy(
    altered,
    Object.keys(profiles),
    bundledConventionVersion,
  );
  expect(errors.join(" ")).toContain("must be a valid profile list");
  expect(errors.join(" ")).toContain("cannot name itself");
  const unknown = {
    ...policy,
    profiles: {
      ...profiles,
      general: { ...profiles.general, requires: ["missing"] },
    },
  };
  expect(
    validateProfileCombinationPolicy(unknown, Object.keys(profiles), bundledConventionVersion).join(
      " ",
    ),
  ).toContain("unknown profiles: missing");
});

test.each(["requires", "requiresAny", "prohibits"])("rejects a non-list value for %s", (field) => {
  const altered = {
    version: bundledConventionVersion,
    profiles: {
      general: { ...profiles.general, [field]: "application" },
      application: profiles.application,
    },
  };
  expect(
    validateProfileCombinationPolicy(altered, Object.keys(profiles), bundledConventionVersion).join(
      " ",
    ),
  ).toContain(`general.${field} must be a valid profile list`);
});

test("rejects contradictory requirements and unsupported fields", () => {
  const altered = {
    version: bundledConventionVersion,
    profiles: {
      general: {
        requires: ["application"],
        requiresAny: [],
        prohibits: ["application"],
        extra: true,
      },
      application: profiles.application,
    },
  };
  const errors = validateProfileCombinationPolicy(
    altered,
    Object.keys(profiles),
    bundledConventionVersion,
  );
  expect(errors.join(" ")).toContain("unsupported fields");
  expect(errors.join(" ")).toContain("both requires and prohibits");
  const missingList = {
    ...policy,
    profiles: {
      ...profiles,
      general: { requires: [], requiresAny: [] },
    },
  };
  expect(
    validateProfileCombinationPolicy(
      missingList,
      Object.keys(profiles),
      bundledConventionVersion,
    ).join(" "),
  ).toContain("must define requires, requiresAny, and prohibits");
});

test("rejects a version that differs from the bundled convention version", () => {
  expect(
    validateProfileCombinationPolicy(
      { ...policy, version: "0.0" },
      Object.keys(profiles),
      bundledConventionVersion,
    ).join(" "),
  ).toContain("must use the current convention version");
});

test("rejects malformed policy roots and profile entries", () => {
  expect(validateProfileCombinationPolicy(null, [], bundledConventionVersion).join(" ")).toContain(
    "must contain an object",
  );
  expect(
    validateProfileCombinationPolicy(
      { version: bundledConventionVersion, profiles: [] },
      [],
      bundledConventionVersion,
    ).join(" "),
  ).toContain("must define profiles");
  expect(
    validateProfileCombinationPolicy(
      { ...policy, extra: true },
      Object.keys(profiles),
      bundledConventionVersion,
    ).join(" "),
  ).toContain("contains unsupported fields");
  const invalidEntry = {
    version: bundledConventionVersion,
    profiles: {
      "invalid name": [],
    },
  };
  expect(
    validateProfileCombinationPolicy(invalidEntry, [], bundledConventionVersion).join(" "),
  ).toContain("invalid entry");
});
