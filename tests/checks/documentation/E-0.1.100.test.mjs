import { expect, test } from "@jest/globals";
import { run } from "../../../src/checks/documentation/E-0.1.100.mjs";

test("passes the documentation convention check", () => {
  expect(run()).toEqual({
    ruleId: "E-0.1.100",
    status: "pass",
    message: "",
  });
});
