import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/ghcr-published/E-1.160.mjs";

test("passes the GHCR publication check", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});
