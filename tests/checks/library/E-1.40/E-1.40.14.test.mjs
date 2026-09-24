import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.14.mjs";

test("passes when a library has no pure export barrels", async () => {
  await expect(run({ root: "/repo", packageJson: { eliware: { apply: ["library"] } } })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});
