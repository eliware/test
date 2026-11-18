import { expect, test } from "@jest/globals";
import classifyJestOutputFailure from "../../../../../../src/validation/stages/jest/execution/classify/output-failure.mjs";

test("classifies redacted and unsaved Jest output", () => {
  expect(
    classifyJestOutputFailure("rule", {
      outputRedacted: true,
      outputRedactionKinds: ["token"],
    }).message,
  ).toContain("(token)");
  expect(classifyJestOutputFailure("rule", { outputLogError: true }).message).toContain(
    "could not be saved",
  );
  expect(classifyJestOutputFailure("rule", {})).toBeNull();
});
