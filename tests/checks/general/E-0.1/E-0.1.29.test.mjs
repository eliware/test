import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.29.mjs";

test("registers the tracked-symlink convention group", () => {
  expect(run()).toMatchObject({ status: "pass", ruleId: "E-0.1.29" });
});
