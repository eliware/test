import { expect, jest, test } from "@jest/globals";
import { executeConventionCheck } from "../../../src/validation/check-execution/execute-convention-check.mjs";

test("validates one check result and reports timing", async () => {
  const timing = { start: jest.fn(), end: jest.fn() };
  await expect(
    executeConventionCheck(
      { ruleId: "E-0.1", run: async () => ({ ruleId: "E-0.1", status: "pass", message: "" }) },
      { timing },
    ),
  ).resolves.toEqual({ ruleId: "E-0.1", status: "pass", message: "" });
  expect(timing.start).toHaveBeenCalledWith("E-0.1");
  expect(timing.end).toHaveBeenCalledWith("E-0.1");
});

test("converts thrown errors into a stable failure result", async () => {
  await expect(
    executeConventionCheck(
      {
        ruleId: "E-2",
        run: async () => {
          throw new Error("inspection failed");
        },
      },
      {},
    ),
  ).resolves.toMatchObject({
    ruleId: "E-2",
    status: "fail",
    message: "Check execution threw: inspection failed",
  });
  await expect(
    executeConventionCheck(
      {
        ruleId: "E-3",
        run: async () => {
          throw "failure";
        },
      },
      {},
    ),
  ).resolves.toEqual({
    ruleId: "E-3",
    status: "fail",
    message: "Check execution threw: Check threw a non-Error value.",
  });
});

test("rejects incomplete checks and invalid result identities", async () => {
  await expect(executeConventionCheck({ ruleId: "E-4" }, {})).rejects.toThrow("is incomplete");
  await expect(
    executeConventionCheck(
      { ruleId: "E-4", run: async () => ({ ruleId: "E-5", status: "pass", message: "" }) },
      {},
    ),
  ).rejects.toThrow("invalid result");
});

test("does not require timing callbacks when unavailable", async () => {
  const timing = {};
  await executeConventionCheck(
    { ruleId: "E-5", run: async () => ({ ruleId: "E-5", status: "pass", message: "" }) },
    { timing },
  );
  expect(timing).toEqual({});
});
