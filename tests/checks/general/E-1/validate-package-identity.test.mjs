import { expect, test } from "@jest/globals";
import { validatePackageIdentity } from "../../../../src/checks/general/E-1/validate-package-identity.mjs";

test("validates scoped package identity and semantic version", () => {
  expect(validatePackageIdentity({ name: "@eliware/example", version: "8.0.0" })).toBeNull();
  expect(validatePackageIdentity({ name: "example", version: "8.0.0" })).toContain("scoped");
  expect(validatePackageIdentity({ name: "@eliware/example", version: "8" })).toContain("semantic");
});
