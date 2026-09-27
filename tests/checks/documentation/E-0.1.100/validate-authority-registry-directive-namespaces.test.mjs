import { expect, test } from "@jest/globals";
import { validateAuthorityRegistryDirectiveNamespaces } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-directive-namespaces.mjs";

test("requires every namespace to use the directive identifier format", () => {
  expect(validateAuthorityRegistryDirectiveNamespaces({ repository: "example" })).toContain(
    "valid directiveNamespaces",
  );
  expect(validateAuthorityRegistryDirectiveNamespaces({
    repository: "example",
    directiveNamespaces: ["E-0.1", "A-2.4.6"],
  })).toBeNull();
  expect(validateAuthorityRegistryDirectiveNamespaces({
    repository: "example",
    directiveNamespaces: ["invalid"],
  })).toContain("valid directiveNamespaces");
});
