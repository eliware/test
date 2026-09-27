import { expect, test } from "@jest/globals";
import { validateAuditArguments } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-audit-arguments.mjs";

test("allows only harmless flags and rejects audit-scope overrides", () => {
  for (const args of [
    ["--audit-level=low"], ["--audit-level", "low"], ["--no-json"], ["--json=false"],
    ["--registry=https://registry.example/"], ["--userconfig", "custom.npmrc"],
    ["--registry", "https://registry.example/"],
    ["--config", "registry=https://registry.example/"], ["--", "--audit-level=low"],
  ]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
  expect(validateAuditArguments(["--no-fund", "--no-progress"])).toBeNull();
  // npm audit has no positional package selector; audit scope comes from the project/workspaces.
  for (const args of [["alpha"], ["--", "alpha"], ["--workspace", "package-a"], ["--invented-option"]]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
  expect(validateAuditArguments()).toBeNull();
  for (const args of [null, [null], [1]]) {
    expect(validateAuditArguments(args)).toBe("Audit arguments must be an array of strings.");
  }
  for (const args of [
    ["--omit=dev"], ["--omit", "optional"], ["--omit-optional"], ["--omit=peer"],
    ["--workspace=package-a"], ["--workspaces=false"], ["-w=package-a"],
    ["--no-workspaces"], ["--no-workspace"], ["--no-include-workspace-root"],
  ]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
});
