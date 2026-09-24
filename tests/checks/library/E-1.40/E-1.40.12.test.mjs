import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.12.mjs";

test("reports missing source/test roots under the library directive", async () => {
  await expect(run({ root: "/repo" })).resolves.toMatchObject({ ruleId, status: "fail" });
});
