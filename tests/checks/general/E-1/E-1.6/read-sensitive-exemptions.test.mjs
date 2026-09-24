import { expect, test } from "@jest/globals";
import { readSensitiveExemptions } from "../../../../../src/checks/general/E-1/E-1.6/read-sensitive-exemptions.mjs";

test("extracts only path exemptions for the requested rule", () => {
  expect(readSensitiveExemptions({ eliware: { exempt: [
    { ruleId: "E-1.6.0", path: "credentials.json", reason: "approved test exception", approver: "Eli", approvalTimestamp: new Date().toISOString(), expiry: null },
    { ruleId: "E-1.6.0", path: "invalid.json" },
    { ruleId: "E-1.7", path: "other.json" },
  ] } }, "E-1.6.0")).toEqual(new Set(["credentials.json"]));
});

test("returns no exemptions when package metadata has none", () => {
  expect(readSensitiveExemptions({}, "E-1.6.0")).toEqual(new Set());
});
