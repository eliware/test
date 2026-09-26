import { expect, test } from "@jest/globals";
import { validateAuditArguments } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-audit-arguments.mjs";

test("rejects arguments that weaken required npm audit severity or JSON output", () => {
  for (const args of [
    ["--audit-level=low"], ["--audit-level", "low"], ["--no-json"], ["--json=false"],
    ["--registry=https://registry.example/"], ["--userconfig", "custom.npmrc"],
    ["--registry", "https://registry.example/"],
    ["--config", "registry=https://registry.example/"], ["--", "--audit-level=low"],
  ]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
  expect(validateAuditArguments(["--omit=dev"])).toBeNull();
  expect(validateAuditArguments()).toBeNull();
  for (const args of [null, "--omit=dev", [null], [1]]) {
    expect(validateAuditArguments(args)).toBe("Audit arguments must be an array of strings.");
  }
});
