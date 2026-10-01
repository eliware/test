import { expect, test } from "@jest/globals";
import { validateAuditArguments } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-audit-arguments.mjs";

test("allows only harmless flags and rejects audit-scope overrides", () => {
  for (const args of [
    ["--audit-level=low"],
    ["--audit-level", "low"],
    ["--no-json"],
    ["--json=false"],
    ["--registry=https://registry.example/"],
    ["--userconfig", "custom.npmrc"],
    ["--registry", "https://registry.example/"],
    ["--config", "registry=https://registry.example/"],
    ["--", "--audit-level=low"],
  ]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
  expect(validateAuditArguments(["--no-fund", "--no-progress"])).toBeNull();
  for (const argument of [
    "--no-fund=false",
    "--no-progress=false",
    "--no-fund=true",
    "--no-progress=true",
  ]) {
    expect(validateAuditArguments([argument])).toMatch(/cannot override/u);
  }
  // npm audit has no positional package selector; audit scope comes from the project/workspaces.
  for (const args of [
    ["alpha"],
    ["--", "alpha"],
    ["--workspace", "package-a"],
    ["--invented-option"],
  ]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
  expect(validateAuditArguments()).toBeNull();
  for (const args of [
    ["--omit=dev"],
    ["--omit-dev"],
    ["--omit", "optional"],
    ["--omit-optional"],
    ["--omit=peer"],
    ["--workspace=package-a"],
    ["--workspaces=false"],
    ["-w=package-a"],
    ["--no-workspaces"],
    ["--no-workspace"],
    ["--no-include-workspace-root"],
  ]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
});

test("rejects non-string items before parsing audit options", () => {
  expect(validateAuditArguments(["--no-fund", 1])).toBe(
    "Audit arguments must be an array of strings.",
  );
  expect(validateAuditArguments([null])).toBe("Audit arguments must be an array of strings.");
  expect(validateAuditArguments(null)).toBe("Audit arguments must be an array of strings.");
  expect(validateAuditArguments("--no-fund")).toBe("Audit arguments must be an array of strings.");
  const sparseArguments = ["--no-fund"];
  sparseArguments.length = 2;
  expect(Object.hasOwn(sparseArguments, 1)).toBe(false);
  expect(validateAuditArguments(sparseArguments)).toBe(
    "Audit arguments must be an array of strings.",
  );
});
