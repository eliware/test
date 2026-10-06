import { expect, test } from "@jest/globals";
import { buildAuditArguments } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/build-audit-arguments.mjs";

test("builds the strict JSON audit command", () => {
  expect(buildAuditArguments()).toEqual(["audit", "--json", "--audit-level=high"]);
  expect(buildAuditArguments(["--no-fund"])).toEqual([
    "audit",
    "--no-fund",
    "--json",
    "--audit-level=high",
  ]);
  expect(() => buildAuditArguments(["--audit-level=low"])).toThrow("cannot override");
  expect(() => buildAuditArguments(["--no-json"])).toThrow("cannot override");
});
