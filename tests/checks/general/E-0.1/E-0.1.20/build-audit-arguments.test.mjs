import { expect, test } from "@jest/globals";
import { buildAuditArguments } from "../../../../../src/checks/general/E-0.1/E-0.1.20/build-audit-arguments.mjs";

test("builds the strict JSON audit command", () => {
  expect(buildAuditArguments()).toEqual(["audit", "--json", "--audit-level=high"]);
});
