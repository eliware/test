import { expect, test } from "@jest/globals";
import resolveJestCli from "../../../../../../../../../src/validation/stages/jest/configuration/resolve/jest/cli/resolve/jest-cli.mjs";

test("resolves the consumer CLI or falls back to the shared CLI", () => {
  expect(resolveJestCli(process.cwd())).toContain("jest");
  expect(resolveJestCli("C:/missing-consumer")).toContain("jest");
});
