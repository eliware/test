import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.15.mjs";

test("skips test-output inspection when the application test stage is disabled", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
