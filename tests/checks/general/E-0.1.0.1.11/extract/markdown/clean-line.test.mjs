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

test("carries HTML comment state across lines", () => {
  const hidden = cleanMarkdownProseLine("Visible <!-- hidden", false);
  const closed = cleanMarkdownProseLine("hidden --> shown", hidden.htmlComment);

  expect(hidden).toEqual({ text: "Visible", htmlComment: true });
  expect(closed).toEqual({ text: "shown", htmlComment: false });
});
