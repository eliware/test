import { expect, test } from "@jest/globals";
import { findSeparateTestRunnerConfigs } from "../../../../src/checks/application/E-0.1.4.1.3/find-separate-test-runner-configs.mjs";

test("finds supported runner configuration files by basename", () => {
  expect(
    findSeparateTestRunnerConfigs(["jest.config.ts", "nested/.mocharc.yaml", "vite.config.mjs"]),
  ).toEqual(["jest.config.ts", "nested/.mocharc.yaml"]);
});

test("returns no files when no supported runner configuration exists", () => {
  expect(findSeparateTestRunnerConfigs(["package.json", "vitest.test.mjs"])).toEqual([]);
});
