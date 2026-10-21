import { expect, test } from "@jest/globals";
import { slugMarkdownHeading } from "../../../../src/checks/general/E-0.1.0.1.4/slug-markdown-heading.mjs";

test("creates heading slugs from Markdown links and inline formatting", () => {
  expect(slugMarkdownHeading("A [linked](page.md) **bold** heading!")).toBe(
    "a-linked-bold-heading",
  );
});

test("keeps underscores and normalizes spaces", () => {
  expect(slugMarkdownHeading("My_heading   with spaces")).toBe("my_heading-with-spaces");
});
