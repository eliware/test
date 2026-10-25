import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/application/E-0.1.4.1.1.mjs";

test("returns the public pass and fail rule result shapes", async () => {
  await expect(run()).resolves.toEqual({ ruleId, status: "pass", message: "" });
  await expect(run({ packageJson: { bin: { "bad name": "../app.mjs" } } })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("Entrypoint target must use a canonical path under bin/"),
  });
});
