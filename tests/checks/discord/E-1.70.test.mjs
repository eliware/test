import { expect, test } from "@jest/globals";
import { run } from "../../../src/checks/discord/E-1.70.mjs";

test("passes the Discord convention check", () => {
  expect(run()).toEqual({
    ruleId: "E-1.70",
    status: "pass",
    message: "",
  });
});
