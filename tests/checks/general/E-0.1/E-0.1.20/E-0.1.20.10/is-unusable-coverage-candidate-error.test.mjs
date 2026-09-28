import { expect, test } from "@jest/globals";
import { isUnusableCoverageCandidateError } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/is-unusable-coverage-candidate-error.mjs";

test("classifies known unusable coverage errors as recoverable", () => {
  const errors = [
    Object.assign(new Error("missing"), { code: "ENOENT" }),
    new SyntaxError("invalid JSON"),
    new Error("Detailed coverage is incomplete"),
    new Error("Coverage report does not account for every source file"),
    new Error("Coverage report is invalid"),
    new Error("Coverage evidence is incomplete"),
    new Error("Coverage evidence has an invalid shape"),
    new Error("Coverage map and counter keys differ"),
    new Error("Coverage line counters do not match source-derived line coverage"),
    new Error("Summary-only coverage cannot prove completeness"),
  ];
  for (const error of errors) expect(isUnusableCoverageCandidateError(error)).toBe(true);
});

test("does not classify unrelated or non-error values as recoverable", () => {
  for (const error of [
    null,
    undefined,
    "failure",
    7,
    {},
    { message: "Coverage report is invalid" },
  ]) {
    expect(isUnusableCoverageCandidateError(error)).toBe(false);
  }
});
