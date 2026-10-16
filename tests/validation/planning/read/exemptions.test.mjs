import { expect, test } from "@jest/globals";
import { readExemptions } from "../../../../src/validation/planning/read/exemptions.mjs";

test("returns validated exemption rule scopes", () => {
  expect(readExemptions()).toEqual(new Map());
  expect(readExemptions({})).toEqual(new Map());
  expect(readExemptions({ eliware: {} })).toEqual(new Map());
  expect(
    readExemptions({
      eliware: {
        exempt: [
          {
            ruleId: "E-0.1.130.14",
            reason: "x",
            approver: "Eli",
            approvalTimestamp: "2026-09-13T00:00:00Z",
            expiry: null,
          },
        ],
      },
    }),
  ).toEqual(new Map([["E-0.1.130.14", null]]));
  expect(
    readExemptions({
      eliware: {
        exempt: [
          {
            ruleId: "E-0.1.130.15",
            reason: "fixture",
            approver: "Eli",
            approvalTimestamp: "2026-09-13T00:00:00Z",
            expiry: null,
            paths: ["infrastructure/gateway/standard-install.yaml"],
          },
        ],
      },
    }),
  ).toEqual(new Map([["E-0.1.130.15", ["infrastructure/gateway/standard-install.yaml"]]]));
  expect(() =>
    readExemptions({
      eliware: {
        exempt: [
          { ruleId: "E-0.1", reason: "", approver: "Eli", approvalTimestamp: "x", expiry: null },
        ],
      },
    }),
  ).toThrow();
});
