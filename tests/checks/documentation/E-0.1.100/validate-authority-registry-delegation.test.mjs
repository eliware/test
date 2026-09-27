import { expect, test } from "@jest/globals";
import { validateAuthorityRegistryDelegation } from "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-delegation.mjs";

test("accepts omitted delegation and references to registered repositories", () => {
  const repositories = new Set(["eliware/example", "eliware/shared"]);
  expect(validateAuthorityRegistryDelegation({}, repositories)).toBeNull();
  expect(validateAuthorityRegistryDelegation({
    baselineFor: ["eliware/shared"],
    inheritsSharedBaselineFrom: "eliware/shared",
  }, repositories)).toBeNull();
});

test("rejects malformed or unsupported baseline delegation", () => {
  const repositories = new Set(["eliware/example"]);
  expect(validateAuthorityRegistryDelegation({ baselineFor: "eliware/example" }, repositories))
    .toContain("baselineFor contains unsupported delegation");
  expect(validateAuthorityRegistryDelegation({ baselineFor: ["missing"] }, repositories))
    .toContain("baselineFor contains unsupported delegation");
  expect(validateAuthorityRegistryDelegation({ inheritsSharedBaselineFrom: "missing" }, repositories))
    .toContain("inheritsSharedBaselineFrom contains unsupported delegation");
});
