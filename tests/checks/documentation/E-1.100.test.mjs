import { expect, test } from "@jest/globals";
import { run } from "../../../src/checks/documentation/E-1.100.mjs";

test("passes the documentation convention check", () => {
  expect(run()).toEqual({
    ruleId: "E-1.100",
    status: "pass",
    message: "",
  });
});
