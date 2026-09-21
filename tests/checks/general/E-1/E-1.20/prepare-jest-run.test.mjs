import { expect, test } from "@jest/globals";
import { prepareJestRun } from "../../../../../src/checks/general/E-1/E-1.20/prepare-jest-run.mjs";

test("prepares a Jest command and runtime options through injected resolution", async () => {
  const prepared = await prepareJestRun(
    process.cwd(),
    [],
    (_root, options) => options.jestCli,
    { jestCli: "consumer-jest" },
  );
  expect(prepared.command).toBe(process.execPath);
  expect(prepared.args[0]).toBe("consumer-jest");
  expect(prepared.args).toContain("--coverageReporters=json");
  expect(prepared.options).toEqual(expect.objectContaining({ env: expect.any(Object) }));
});

test("uses default arguments and timing reporter configuration", async () => {
  const prepared = await prepareJestRun(
    process.cwd(),
    undefined,
    () => "consumer-jest",
    {},
  );
  expect(prepared.args).toContain("--runInBand");
});
