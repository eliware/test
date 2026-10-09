import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/discord/E-0.1.7.1.0.mjs";

test("uses the canonical Discord section order", () => {
  expect(run()).toEqual({ ruleId, status: "pass", message: "" });
});

test("reports invalid shared Discord ordering", () => {
  expect(run({}, { readCanonicalOrder: () => ({}) })).toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("Canonical AGENTS.md ordering"),
  });
});
