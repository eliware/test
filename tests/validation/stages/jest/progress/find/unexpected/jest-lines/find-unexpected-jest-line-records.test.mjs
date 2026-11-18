import { expect, test } from "@jest/globals";
import findUnexpectedJestLineRecords from "../../../../../../../../src/validation/stages/jest/progress/find/unexpected/jest-lines/find-unexpected-jest-line-records.mjs";

test("ignores a trailing incomplete output fragment", () => {
  expect(findUnexpectedJestLineRecords("unexpected complete line\npartial…")).toEqual([
    { line: "unexpected complete line", suite: "unknown test suite" },
  ]);
});
