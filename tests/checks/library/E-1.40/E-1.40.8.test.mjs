import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/library/E-1.40/E-1.40.8.mjs";

test("reports source discovery failures under the library directive", async () => {
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toMatchObject({
    ruleId,
    status: "fail",
  });
});
