import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/application/E-1.130/E-1.130.5.mjs";

test("reports source discovery failures under the application directive", async () => {
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toMatchObject({
    ruleId,
    status: "fail",
  });
});
