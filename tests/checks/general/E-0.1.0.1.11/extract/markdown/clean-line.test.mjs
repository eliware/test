import { expect, test } from "@jest/globals";
import { cleanMarkdownProseLine } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/markdown/clean-line.mjs";

test("cleans Markdown syntax and keeps visible link labels", () => {
  expect(
    cleanMarkdownProseLine("- Read [the guide](https://example.com) and `code`.", false),
  ).toEqual({
    text: "Read the guide and .",
    htmlComment: false,
  });
});
