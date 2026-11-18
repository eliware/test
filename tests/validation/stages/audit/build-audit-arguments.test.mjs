import { expect, test } from "@jest/globals";
import buildAuditArguments from "../../../../src/validation/stages/audit/build-audit-arguments.mjs";
test("builds the strict JSON audit command", () => {
  expect(buildAuditArguments()).toEqual(["audit", "--omit=dev", "--json", "--audit-level=high"]);
  expect(buildAuditArguments(["--no-fund"])).toEqual([
    "audit",
    "--no-fund",
    "--omit=dev",
    "--json",
    "--audit-level=high",
  ]);
  expect(() => buildAuditArguments(["--audit-level=low"])).toThrow("cannot override");
  expect(() => buildAuditArguments(["--no-json"])).toThrow("cannot override");
});
