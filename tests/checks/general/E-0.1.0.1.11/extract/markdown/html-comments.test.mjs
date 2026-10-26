import { expect, test } from "@jest/globals";
import { removeMarkdownHtmlComments } from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/markdown/html-comments.mjs";

test("removes a comment and preserves text around it", () => {
  expect(removeMarkdownHtmlComments("before <!-- hidden --> after", false)).toEqual({
    text: "before  after",
    htmlComment: false,
  });
});

test("carries comment state across lines", () => {
  const hidden = removeMarkdownHtmlComments("Visible <!-- hidden", false);
  const closed = removeMarkdownHtmlComments("hidden --> shown", hidden.htmlComment);
  expect(hidden).toEqual({ text: "Visible ", htmlComment: true });
  expect(closed).toEqual({ text: " shown", htmlComment: false });
});
