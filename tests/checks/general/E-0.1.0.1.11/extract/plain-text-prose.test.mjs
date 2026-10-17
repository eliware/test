import { expect, test } from "@jest/globals";
import { extractPlainTextProse } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/plain-text-prose.mjs";

test("returns each nonempty plain-text paragraph with its first line", () => {
  expect(extractPlainTextProse("First line\r\ncontinued.\r\n\r\n\r\nSecond paragraph.")).toEqual([
    { text: "First line continued.", line: 1, kind: "paragraph" },
    { text: "Second paragraph.", line: 5, kind: "paragraph" },
  ]);
});
