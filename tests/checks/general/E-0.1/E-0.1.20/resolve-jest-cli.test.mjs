import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveConsumerJestCli,
  resolveJestCli,
  resolveSharedJestCli,
} from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-jest-cli.mjs";

test("resolves Jest from the consumer package", () => {
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

test("uses the shared Jest fallback when the consumer has no resolvable Jest", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-no-jest-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
    expect(() => resolveConsumerJestCli(root)).toThrow(
      "Consumer repository Jest executable could not be resolved",
    );
    expect(resolveJestCli(root)).toContain("jest.js");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
