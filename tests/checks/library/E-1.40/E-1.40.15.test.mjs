import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.15.mjs";

test("skips Jest when the library test stage is disabled", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
