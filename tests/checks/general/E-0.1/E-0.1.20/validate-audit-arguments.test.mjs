import { expect, test } from "@jest/globals";
import { validateAuditArguments } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-audit-arguments.mjs";

test("rejects arguments that weaken required npm audit severity or JSON output", () => {
  for (const args of [
    ["--audit-level=low"], ["--audit-level", "low"], ["--no-json"], ["--json=false"],
    ["--registry=https://registry.example/"], ["--userconfig", "custom.npmrc"],
    ["--config", "registry=https://registry.example/"], ["--", "--audit-level=low"],
  ]) {
    expect(validateAuditArguments(args)).toMatch(/cannot override/u);
  }
  expect(validateAuditArguments(["--omit=dev"])).toBeNull();
  expect(validateAuditArguments()).toBeNull();
});
