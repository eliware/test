import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.7.mjs";

test("uses the library directive identity and delegates its focused scope", async () => {
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "src/ is required for source/test mirroring.",
  });
});
