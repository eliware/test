import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  resolveConsumerJestCli,
  resolveJestCli,
  resolveSharedJestCli,
} from "../../../../../src/validation/stages/jest/configuration/resolve-jest-cli.mjs";

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
    expect(resolveConsumerJestCli(root)).toBeUndefined();
    expect(resolveJestCli(root)).toContain("jest.js");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not hide a broken Jest installation behind the shared runner", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-broken-jest-"));
  const jestDirectory = join(root, "node_modules", "jest");
  await mkdir(jestDirectory, { recursive: true });
  await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
  await writeFile(
    join(jestDirectory, "package.json"),
    JSON.stringify({ name: "jest", main: "index.js", bin: { jest: "bin/missing.js" } }),
  );
  await writeFile(join(jestDirectory, "index.js"), "module.exports = {};\n");
  try {
    expect(() => resolveJestCli(root)).toThrow("Jest executable does not exist");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
