import { expect, test } from "@jest/globals";
import { readSensitiveExemptions } from "../../../../../src/checks/general/E-1/E-1.6/read-sensitive-exemptions.mjs";

test("extracts only path exemptions for the requested rule", () => {
  expect(readSensitiveExemptions({ eliware: { exempt: [
    { ruleId: "E-1.6.0", path: "credentials.json" },
    { ruleId: "E-1.7", path: "other.json" },
  ] } }, "E-1.6.0")).toEqual(new Set(["credentials.json"]));
});
