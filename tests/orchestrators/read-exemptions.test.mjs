import { expect, test } from "@jest/globals";
import { readExemptions } from "../../src/orchestrators/read-exemptions.mjs";

test("returns validated exemption rule IDs", () => {
  expect(readExemptions()).toEqual(new Set());
  expect(readExemptions({})).toEqual(new Set());
  expect(readExemptions({ eliware: {} })).toEqual(new Set());
  expect(
    readExemptions({
      eliware: {
        exempt: [
          {
            ruleId: "E-1.130.14",
            reason: "x",
            approver: "Eli",
            approvalTimestamp: "2026-09-13T00:00:00Z",
            expiry: null,
          },
        ],
      },
    }),
  ).toEqual(new Set(["E-1.130.14"]));
  expect(() =>
    readExemptions({
      eliware: {
        exempt: [
          { ruleId: "E-1", reason: "", approver: "Eli", approvalTimestamp: "x", expiry: null },
        ],
      },
    }),
  ).toThrow();
});
