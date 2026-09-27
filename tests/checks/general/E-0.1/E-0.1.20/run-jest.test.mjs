import { expect, jest, test } from "@jest/globals";
import { runJest } from "../../../../../src/checks/general/E-0.1/E-0.1.20/run-jest.mjs";

test("coordinates prepared command execution and returns the executor result", async () => {
  const execute = jest.fn(async () => ({ code: 0, stdout: "passed", stderr: "" }));
  const result = await runJest(
    process.cwd(),
    [],
    execute,
    { jestCli: "jest-cli" },
  );
  expect(execute).toHaveBeenCalledTimes(1);
  expect(result).toMatchObject({ code: 0, stdout: "passed" });
  expect(result.coverageDirectory).toBeUndefined();
});

test("cleans coverage artifacts when command execution throws", async () => {
  const removeCoverage = jest.fn();
  await expect(runJest(
    process.cwd(),
    undefined,
    async () => { throw new Error("Jest could not start"); },
    { jestCli: "jest-cli" },
    removeCoverage,
  )).rejects.toThrow("Jest could not start");
  expect(removeCoverage).toHaveBeenCalledWith(expect.any(String), {
    recursive: true,
    force: true,
  });
});
