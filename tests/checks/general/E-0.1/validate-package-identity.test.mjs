import { expect, test } from "@jest/globals";
import packageMetadata from "../../../../package.json" with { type: "json" };
import { validatePackageIdentity } from "../../../../src/checks/general/E-0.1/validate-package-identity.mjs";

test("validates scoped package identity and semantic version", () => {
  expect(
    validatePackageIdentity({ name: "@eliware/example", version: packageMetadata.version }),
  ).toBeNull();
  expect(validatePackageIdentity({ name: "example", version: packageMetadata.version })).toContain(
    "scoped",
  );
  expect(validatePackageIdentity({ name: "@eliware/example", version: "8" })).toContain("semantic");
  expect(validatePackageIdentity({ name: "@eliware/example" })).toContain("semantic");
});
