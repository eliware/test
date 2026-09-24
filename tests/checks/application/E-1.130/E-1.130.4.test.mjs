import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.4.mjs";

test("uses the application directive identity and delegates its focused scope", async () => {
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "src/ is required for source/test mirroring.",
  });
});
