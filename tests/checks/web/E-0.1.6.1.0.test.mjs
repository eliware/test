import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/web/E-0.1.6.1.0.mjs";

test("E-0.1.6.1.0 reports shared document-order enforcement", () => {
  expect(run()).toEqual({
    ruleId,
    status: "pass",
    message: "General checks enforce README.md and AGENTS.md order.",
  });
});
