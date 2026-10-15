import { expect, test } from "@jest/globals";
import { findTestIsolationViolations } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-isolation/find-test-isolation-violations.mjs";

test("reports unparseable test modules", () => {
  expect(findTestIsolationViolations("const = ;")).toEqual(["could not parse the test module."]);
});

test("combines and removes repeated effect findings", () => {
  const source = "fetch(target); fetch(other); setTimeout(run, 1);";
  expect(findTestIsolationViolations(source)).toEqual([
    "must use fake timers or inject a fixed clock for timer calls.",
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
});
