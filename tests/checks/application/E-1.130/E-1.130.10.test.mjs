import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.10.mjs";

test("reports missing source/test roots under the application directive", async () => {
  await expect(run({ root: "/repo" })).resolves.toMatchObject({ ruleId, status: "fail" });
});
