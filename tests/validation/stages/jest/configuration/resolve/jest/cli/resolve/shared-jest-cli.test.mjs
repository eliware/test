import { expect, jest, test } from "@jest/globals";
import resolveSharedJestCli from "../../../../../../../../../src/validation/stages/jest/configuration/resolve/jest/cli/resolve/shared-jest-cli.mjs";

test("resolves Jest names with a supplied resolver and uses default dependencies", () => {
  const resolveBin = jest.fn((_require, name) => (name === "jest-cli" ? "jest-cli/bin.js" : null));
  expect(resolveSharedJestCli(resolveBin, {})).toBe("jest-cli/bin.js");
  expect(resolveBin).toHaveBeenCalledTimes(2);
  expect(resolveSharedJestCli()).toContain("jest");
});
