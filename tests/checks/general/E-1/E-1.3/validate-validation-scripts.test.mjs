import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.3.mjs";

test("rejects direct validation commands in package scripts", async () => {
  await expect(run({ packageJson: { scripts: { test: "jest" } } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await expect(run({ packageJson: { scripts: { test: "npx --yes jest" } } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});
