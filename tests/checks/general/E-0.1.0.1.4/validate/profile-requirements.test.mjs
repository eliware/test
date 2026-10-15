import { expect, test } from "@jest/globals";
import { validateProfileRequirements } from "../../../../../src/checks/general/E-0.1.0.1.4/validate/profile-requirements.mjs";

const path = "specs/conventions/alpha-deterministic.yaml document 1";

test("accepts valid profile relationships", () => {
  const documents = [
    { path, value: { requires: ["beta"], conflicts: [] } },
    {
      path: "specs/conventions/beta-semantic.yaml",
      value: { requires: [], conflicts: [] },
    },
    { path: "specs/conventions/extra.yaml", value: { requires: [], conflicts: [] } },
  ];
  expect(validateProfileRequirements(documents[0].value, path, documents)).toEqual([]);
});

test("skips non-convention files and unrelated convention names", () => {
  expect(validateProfileRequirements({}, "specs/directives.yaml", [])).toEqual([]);
  expect(validateProfileRequirements({}, "specs/conventions/extra.yaml", [])).toEqual([]);
});

test("requires arrays and rejects duplicate, self, and unknown profiles", () => {
  expect(
    validateProfileRequirements(
      { requires: ["alpha", "missing", "missing"], conflicts: null },
      path,
      [],
    ),
  ).toEqual([
    `${path}.requires must not contain duplicate profiles.`,
    `${path}.requires must not include its own profile.`,
    `${path}.requires names unknown profiles: alpha, missing, missing.`,
    `${path}.conflicts must list valid profile names.`,
  ]);
});

test("requires reciprocal conflict declarations", () => {
  const value = { requires: [], conflicts: ["beta"] };
  const documents = [
    { path, value },
    { path: "specs/conventions/beta-semantic.yaml", value: { requires: [], conflicts: [] } },
  ];
  expect(validateProfileRequirements(value, path, documents)).toEqual([
    `${path}.conflicts must be declared by beta.`,
  ]);
});

test("accepts a reciprocal conflict declaration", () => {
  const value = { requires: [], conflicts: ["beta"] };
  const documents = [
    { path, value },
    {
      path: "specs/conventions/beta-semantic.yaml",
      value: { requires: [], conflicts: ["alpha"] },
    },
  ];
  expect(validateProfileRequirements(value, path, documents)).toEqual([]);
});
