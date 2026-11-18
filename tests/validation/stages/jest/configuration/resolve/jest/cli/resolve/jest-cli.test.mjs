import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import resolveJestCli from "../../../../../../../../../src/validation/stages/jest/configuration/resolve/jest/cli/resolve/jest-cli.mjs";

test("resolves the consumer CLI or falls back to the shared CLI", () => {
  expect(resolveJestCli(process.cwd())).toContain("jest");
  expect(resolveJestCli(resolve("missing-consumer"))).toContain("jest");
});

test("resolves jest-cli when the consumer has no jest executable", () => {
  const names = [];
  const resolveBin = (_require, name) => {
    names.push(name);
    return name === "jest-cli" ? "consumer/jest-cli.js" : undefined;
  };

  expect(resolveJestCli(process.cwd(), resolveBin)).toBe("consumer/jest-cli.js");
  expect(names).toEqual(["jest", "jest-cli"]);
});

test("falls back to the shared CLI when the consumer has no executable", () => {
  let calls = 0;
  const resolveBin = () => {
    calls += 1;
    return calls === 3 ? "shared/jest.js" : undefined;
  };

  expect(resolveJestCli(resolve("missing-consumer"), resolveBin)).toBe("shared/jest.js");
  expect(calls).toBe(3);
});
