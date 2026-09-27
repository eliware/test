import { expect, jest, test } from "@jest/globals";
import { executePreparedJestRun } from "../../../../../src/checks/general/E-0.1/E-0.1.20/execute-prepared-jest-run.mjs";

test("executes the prepared command and returns its result", async () => {
  const prepared = { command: "node", args: ["jest"], options: { cwd: "/repo" } };
  const execute = jest.fn(async () => ({ code: 0, stdout: "passed" }));
  await expect(executePreparedJestRun(prepared, execute)).resolves.toEqual({
    code: 0,
    stdout: "passed",
  });
  expect(execute).toHaveBeenCalledWith("node", ["jest"], { cwd: "/repo" });
});
