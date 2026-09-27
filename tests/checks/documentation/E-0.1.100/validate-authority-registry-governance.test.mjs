import { expect, test } from "@jest/globals";
import { validateAuthorityRegistryGovernance } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-governance.mjs";

const entry = { repository: "eliware/example", governs: ["example.subject"] };

test("requires non-empty string governance targets", () => {
  expect(validateAuthorityRegistryGovernance({ ...entry, governs: [] }, new Set())).toContain(
    "valid governs",
  );
  expect(validateAuthorityRegistryGovernance({ ...entry, governs: [""] }, new Set())).toContain(
    "valid governs",
  );
  expect(validateAuthorityRegistryGovernance({ ...entry, governs: [null] }, new Set())).toContain(
    "valid governs",
  );
});

test("records unique normative targets and rejects duplicates", () => {
  const targets = new Set();
  expect(validateAuthorityRegistryGovernance(entry, targets)).toBeNull();
  expect(targets.has("example.subject")).toBe(true);
  expect(validateAuthorityRegistryGovernance(entry, targets)).toContain("Duplicate normative");
});
