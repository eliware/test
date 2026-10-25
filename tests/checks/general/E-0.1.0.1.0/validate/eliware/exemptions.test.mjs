import { expect, test } from "@jest/globals";
import { validateEliwareExemptions } from "../../../../../../src/checks/general/E-0.1.0.1.0/validate/eliware/exemptions.mjs";

const valid = {
  ruleId: "E-0.1.0.1.0",
  reason: "Approved",
  approver: "Eli",
  approvalTimestamp: "2099-01-01T00:00:00Z",
  expiry: null,
};

test("accepts a known deterministic rule exemption", () => {
  expect(validateEliwareExemptions({ exempt: [valid] })).toEqual([]);
});

test.each([undefined, null, "bad"])("rejects malformed exemption data %p", (exempt) => {
  expect(validateEliwareExemptions({ exempt })).toContainEqual(
    expect.stringContaining("Every exemption"),
  );
});

test("rejects exemptions for unknown and semantic rule IDs", () => {
  expect(validateEliwareExemptions({ exempt: [{ ...valid, ruleId: "E-999.0" }] })).toContain(
    "Every convention exemption must identify a known rule ID.",
  );
  expect(validateEliwareExemptions({ exempt: [{ ...valid, ruleId: "E-0.1.0.0.0" }] })).toContain(
    "Every convention exemption must identify a known rule ID.",
  );
});

test("accepts metadata without an exemption field", () => {
  expect(validateEliwareExemptions({ id: "E-1" })).toEqual([]);
  expect(validateEliwareExemptions()).toEqual([]);
});
