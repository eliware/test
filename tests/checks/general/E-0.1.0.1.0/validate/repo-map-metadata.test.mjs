import { expect, test } from "@jest/globals";
import { validateRepoMapMetadata } from "../../../../../src/checks/general/E-0.1.0.1.0/validate/repo-map-metadata.mjs";

const record = {
  id: "E-1",
  repository: "eliware/example",
  description: "Example",
  keywords: "eliware, example",
  profiles: "general",
};
const packageJson = {
  eliware: { id: "E-1", apply: ["general"] },
  description: "Example",
  keywords: ["eliware", "example"],
};

test("accepts metadata that matches the repository map", () => {
  expect(validateRepoMapMetadata(packageJson, record)).toBeNull();
});

test("reports malformed repository map records", () => {
  expect(validateRepoMapMetadata(packageJson, { ...record, id: "bad" })).toContain(
    "valid identity",
  );
  expect(validateRepoMapMetadata(packageJson, { ...record, keywords: [] })).toContain(
    "keywords and profiles",
  );
  expect(validateRepoMapMetadata(packageJson, { ...record, profiles: null })).toContain(
    "keywords and profiles",
  );
});

test("reports package fields that differ from the map", () => {
  const failure = validateRepoMapMetadata(
    {
      ...packageJson,
      eliware: { id: "E-2", apply: ["application"] },
      description: "Other",
      keywords: ["other"],
    },
    record,
  );
  expect(failure).toContain("id must match");
  expect(failure).toContain("description must match");
  expect(failure).toContain("keywords must match");
  expect(failure).toContain("apply must match");
});

test.each([[{ ...record, repository: "bad" }], [{ ...record, description: " " }]])(
  "rejects invalid identity fields",
  (invalid) => {
    expect(validateRepoMapMetadata(packageJson, invalid)).toContain("valid identity");
  },
);

test("accepts array map fields", () => {
  expect(
    validateRepoMapMetadata(packageJson, {
      ...record,
      keywords: ["eliware", "example"],
      profiles: ["general"],
    }),
  ).toBeNull();
});

test("accepts matching exemption lists when object key order differs", () => {
  const exemption = {
    ruleId: "E-0.1.0.1.8",
    reason: "Keep encrypted secret files.",
    approver: "Eli",
    approvalTimestamp: "2026-10-16T00:00:00Z",
    expiry: null,
    paths: ["secrets/**"],
  };
  const mapExemption = Object.fromEntries(Object.entries(exemption).reverse());
  expect(
    validateRepoMapMetadata(
      { ...packageJson, eliware: { ...packageJson.eliware, exempt: [exemption] } },
      { ...record, exemptions: [mapExemption] },
    ),
  ).toBeNull();
});

test("requires matching exemption fields and path lists", () => {
  const packageExemption = {
    ruleId: "E-0.1.0.1.8",
    reason: "Keep encrypted secret files.",
    approver: "Eli",
    approvalTimestamp: "2026-10-16T00:00:00Z",
    expiry: null,
    paths: ["secrets/**"],
  };
  const mapExemption = { ...packageExemption, paths: ["secrets/*.yaml"] };
  const failure = validateRepoMapMetadata(
    { ...packageJson, eliware: { ...packageJson.eliware, exempt: [packageExemption] } },
    { ...record, exemptions: [mapExemption] },
  );
  expect(failure).toContain("package exemption list must match repo-map.yaml");
});

test("treats omitted exemption lists as empty lists", () => {
  expect(validateRepoMapMetadata(packageJson, record)).toBeNull();
  expect(
    validateRepoMapMetadata(
      { ...packageJson, eliware: { ...packageJson.eliware, exempt: [] } },
      { ...record, exemptions: [] },
    ),
  ).toBeNull();
});

test("handles missing Eliware package metadata when lists are omitted", () => {
  expect(
    validateRepoMapMetadata({ description: "Example", keywords: ["eliware", "example"] }, record),
  ).toContain("id must match");
});
