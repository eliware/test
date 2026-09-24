import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.17.mjs";

test("skips test-output inspection when the library test stage is disabled", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
