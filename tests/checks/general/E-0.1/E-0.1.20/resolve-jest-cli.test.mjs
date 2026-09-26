import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveConsumerJestCli, resolveJestCli } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-jest-cli.mjs";

test("resolves Jest from the consumer package and supports an injected CLI", () => {
  expect(resolveConsumerJestCli(process.cwd())).toContain("jest.js");
  expect(resolveJestCli(process.cwd(), {})).toContain("jest.js");
  expect(resolveJestCli(process.cwd(), null)).toContain("jest.js");
  expect(resolveJestCli(process.cwd())).toContain("jest.js");
  expect(resolveJestCli("C:/fixture", { jestCli: "jest-cli" })).toBe("jest-cli");
  expect(resolveJestCli("C:/fixture", { jestCli: "custom-jest" })).toBe("custom-jest");
});

test("reports a stable error when the consumer has no resolvable Jest", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-no-jest-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
    expect(() => resolveConsumerJestCli(root)).toThrow("Consumer repository Jest executable could not be resolved");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
