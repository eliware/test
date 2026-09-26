import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-0.1.130/E-0.1.130.12.mjs";

test("passes when an application has no pure export barrels", async () => {
  await expect(run({ root: "/repo", packageJson: { eliware: { apply: ["application"] } } })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});
