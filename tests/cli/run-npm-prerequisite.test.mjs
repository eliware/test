import { expect, jest, test } from "@jest/globals";
import { runNpmPrerequisite } from "../../src/cli/run-npm-prerequisite.mjs";

test("allows validation when the npm version is supported", async () => {
  await expect(runNpmPrerequisite(jest.fn(), async () => null)).resolves.toBe(true);
});

test("reports an unsupported npm version and blocks validation", async () => {
  const write = jest.fn();
  const checkVersion = async () => "npm 12 or later is required for validation; found npm 11.9.1.";
  await expect(runNpmPrerequisite(write, checkVersion)).resolves.toBe(false);
  expect(write).toHaveBeenCalledWith(await checkVersion());
});

test("uses the active npm check when no check is injected", async () => {
  const result = await runNpmPrerequisite(jest.fn());
  expect(typeof result).toBe("boolean");
});
