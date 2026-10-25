import { expect, test } from "@jest/globals";
import { repoMapExemptionsMatch } from "../../../../../../src/checks/general/E-0.1.0.1.0/validate/repo-map/exemptions.mjs";

test("compares exemption objects without depending on key order", () => {
  const exemption = { ruleId: "E-1", paths: ["private/**"] };
  const reordered = Object.fromEntries(Object.entries(exemption).reverse());
  expect(
    repoMapExemptionsMatch({ eliware: { exempt: [exemption] } }, { exemptions: [reordered] }),
  ).toBe(true);
});

test("rejects different exemption paths and treats omitted lists as empty", () => {
  expect(
    repoMapExemptionsMatch(
      { eliware: { exempt: [{ ruleId: "E-1", paths: ["private/**"] }] } },
      { exemptions: [{ ruleId: "E-1", paths: ["private/*.yaml"] }] },
    ),
  ).toBe(false);
  expect(repoMapExemptionsMatch({}, {})).toBe(true);
});
