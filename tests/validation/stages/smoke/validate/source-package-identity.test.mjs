import { expect, test } from "@jest/globals";
import { validateSourcePackageIdentity } from "../../../../../src/validation/stages/smoke/validate/source-package-identity.mjs";

test("accepts a source package with a name and version", () => {
  expect(validateSourcePackageIdentity({ name: "@eliware/example", version: "15.0.0" })).toBe(null);
});

test.each([undefined, {}, { name: "@eliware/example" }])(
  "requires source package name and version: %s",
  (packageJson) => {
    expect(validateSourcePackageIdentity(packageJson)).toBe(
      "Source package name and version are required for tarball smoke.",
    );
  },
);
