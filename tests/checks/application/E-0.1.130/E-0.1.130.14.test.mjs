import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-0.1.130/E-0.1.130.14.mjs";

test("skips coverage when the application test stage is disabled", async () => {
  await expect(run({ executeJest: false })).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
