import { expect, test } from "@jest/globals";
import { validateLibraryPackageAllowlist } from "../../../../src/checks/library/E-1.40/validate-library-package-allowlist.mjs";

test("requires a non-empty package file allowlist", () => {
  expect(validateLibraryPackageAllowlist({ files: ["src"] })).toBeNull();
  expect(validateLibraryPackageAllowlist({ files: [] })).toBe("Libraries must declare a package file allowlist.");
  expect(validateLibraryPackageAllowlist({})).toBe("Libraries must declare a package file allowlist.");
  expect(validateLibraryPackageAllowlist()).toBe("Libraries must declare a package file allowlist.");
});
