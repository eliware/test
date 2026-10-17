import { expect, test } from "@jest/globals";
import { findTestIsolationViolations } from "../../../../../src/validation/harness/test-isolation/find/test-isolation-violations.mjs";

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

test("includes HTTP client findings from the focused policy", () => {
  expect(
    findTestIsolationViolations(
      'import * as http from "node:http"; http.get("https://example.com");',
    ),
  ).toContain("must mock HTTP client requests, inject a mock client, or use a localhost URL.");
});
