import { expect, test } from "@jest/globals";
import { parseMarkdownLinkReference } from "../../../../src/checks/documentation/E-0.1.100/parse-markdown-link-reference.mjs";

test("parses query and fragment components independently", () => {
  expect(parseMarkdownLinkReference("guide.md?raw#section")).toEqual({
    path: "guide.md",
    fragment: "section",
  });
  expect(parseMarkdownLinkReference("guide.md#section?raw")).toEqual({
    path: "guide.md",
    fragment: "section?raw",
  });
  expect(parseMarkdownLinkReference("?raw")).toEqual({ path: "", fragment: undefined });
});
