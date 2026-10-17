import { expect, test } from "@jest/globals";
import { withoutJestConfiguration } from "../../../../../src/checks/application/E-0.1.4.1.3/validate/without-jest-configuration.mjs";

test("removes Jest configuration and keeps other package fields", () => {
  expect(
    JSON.parse(
      withoutJestConfiguration(
        '{"jest":{"testEnvironment":"node"},"scripts":{"test":"eliware-test"}}',
      ),
    ),
  ).toEqual({ scripts: { test: "eliware-test" } });
});

test("keeps invalid JSON unchanged for the text scanner", () => {
  expect(withoutJestConfiguration('{"vitest":')).toBe('{"vitest":');
});
