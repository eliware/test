import { expect, test } from "@jest/globals";
import { validateEliwarePackageMetadata } from "../../../../src/checks/general/E-1/validate-eliware-package-metadata.mjs";

const valid = { type: "module", scripts: { test: "eliware-test" }, eliware: { apply: ["general"], authority: { authoritativeFor: ["metadata"], notAuthoritativeFor: ["behavior"] }, crosslinks: [{ path: "../docs/authority-map.json", relation: "relatedAuthority", authoritativeFor: "ownership" }] } };

test("accepts complete package metadata", () => expect(validateEliwarePackageMetadata(valid)).toBeNull());
test.each([
  ["type", { type: "commonjs" }],
  ["scripts", { scripts: {} }],
  ["apply", { eliware: { ...valid.eliware, apply: ["unknown"] } }],
  ["authority", { eliware: { ...valid.eliware, authority: {} } }],
  ["crosslinks", { eliware: { ...valid.eliware, crosslinks: [{}] } }],
  ["scripts type", { scripts: [] }],
  ["scripts value", { scripts: { test: "" } }],
  ["apply type", { eliware: { ...valid.eliware, apply: "general" } }],
  ["apply empty", { eliware: { ...valid.eliware, apply: [] } }],
  ["authority values", { eliware: { ...valid.eliware, authority: { authoritativeFor: [""], notAuthoritativeFor: ["behavior"] } } }],
  ["authority inverse", { eliware: { ...valid.eliware, authority: { authoritativeFor: ["metadata"], notAuthoritativeFor: [""] } } }],
  ["crosslink path", { eliware: { ...valid.eliware, crosslinks: [{ ...valid.eliware.crosslinks[0], path: "" }] } }],
  ["crosslink relation", { eliware: { ...valid.eliware, crosslinks: [{ ...valid.eliware.crosslinks[0], relation: "" }] } }],
  ["crosslink authority", { eliware: { ...valid.eliware, crosslinks: [{ ...valid.eliware.crosslinks[0], authoritativeFor: "" }] } }],
])("rejects invalid %s metadata", (_name, change) => expect(validateEliwarePackageMetadata({ ...valid, ...change })).toEqual(expect.any(String)));

test("rejects malformed exemptions", () => {
  for (const exemption of [null, {}, { ...valid.eliware.exempt?.[0], ruleId: "" }, { ruleId: "E-1", reason: "ok", approver: "Eli", approvalTimestamp: "now", expiry: 4 }]) {
    expect(validateEliwarePackageMetadata({ ...valid, eliware: { ...valid.eliware, exempt: [exemption] } })).toContain("exempt");
  }
});

test("enforces profile-specific publication and privacy metadata", () => {
  expect(validateEliwarePackageMetadata({ ...valid, eliware: { ...valid.eliware, apply: ["private"] }, private: false })).toContain("private");
  expect(validateEliwarePackageMetadata({ ...valid, eliware: { ...valid.eliware, apply: ["npm-published"] }, private: true, publishConfig: { provenance: true } })).toContain("npm-published");
  expect(validateEliwarePackageMetadata({ ...valid, eliware: { ...valid.eliware, apply: ["npm-published"] }, private: false })).toContain("provenance");
});
