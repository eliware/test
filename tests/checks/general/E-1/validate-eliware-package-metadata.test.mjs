import { expect, test } from "@jest/globals";
import { validateEliwarePackageMetadata } from "../../../../src/checks/general/E-1/validate-eliware-package-metadata.mjs";

const valid = { type: "module", scripts: { test: "eliware-test" }, eliware: { apply: ["general"], authority: { authoritativeFor: ["metadata"], notAuthoritativeFor: ["behavior"] }, crosslinks: [{ path: "../docs/authority-map.json", relation: "relatedAuthority", authoritativeFor: "ownership" }] } };

test("composes package metadata validators in stable first-failure order", () => {
  expect(validateEliwarePackageMetadata(valid)).toBeNull();
  expect(validateEliwarePackageMetadata({ ...valid, type: "commonjs", eliware: { ...valid.eliware, apply: ["unknown"] } })).toContain("type");
  expect(validateEliwarePackageMetadata({ ...valid, eliware: { ...valid.eliware, exempt: [{}] } })).toContain("exempt");
});

test("rejects invalid package module and script declarations", () => {
  expect(validateEliwarePackageMetadata({ ...valid, type: "commonjs" })).toContain("type");
  expect(validateEliwarePackageMetadata({ ...valid, scripts: {} })).toContain("scripts");
  expect(validateEliwarePackageMetadata({ ...valid, scripts: { test: "" } })).toContain("scripts");
});
