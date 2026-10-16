import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import {
  resolveConsumerJestCli,
  resolveJestCli,
  resolveSharedJestCli,
} from "../../../../../../../src/validation/stages/jest/configuration/resolve/jest/cli.mjs";

test("resolves Jest from the consumer package and the shared fallback", () => {
  expect(resolveConsumerJestCli(process.cwd())).toContain("jest.js");
  expect(resolveJestCli(process.cwd())).toContain("jest.js");
});

test("resolves the shared Jest fallback when its primary package provides jest-cli", () => {
  const calls = [];
  expect(
    resolveSharedJestCli(
      (_require, packageName) => {
        calls.push(packageName);
        return packageName === "jest-cli" ? "jest-cli/bin/jest.js" : undefined;
      },
      () => {},
    ),
  ).toBe("jest-cli/bin/jest.js");
  expect(calls).toEqual(["jest", "jest-cli"]);
});

test("uses the shared Jest fallback when a consumer has no Jest package", () => {
  const root = resolve("/consumer-without-jest");
  expect(resolveConsumerJestCli(root)).toBeUndefined();
  expect(resolveJestCli(root)).toContain("jest.js");
});
