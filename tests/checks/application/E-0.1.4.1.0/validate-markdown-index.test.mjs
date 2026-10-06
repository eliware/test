import { expect, test } from "@jest/globals";
import { validateMarkdownIndex } from "../../../../src/checks/application/E-0.1.4.1.0/validate-markdown-index.mjs";

test("accepts plain and dot-relative links", () => {
  expect(
    validateMarkdownIndex("[A](a.md) [B](./b.md)", ["a.md", "b.md"], "docs/README.md"),
  ).toEqual([]);
});

test("reports each missing Markdown link", () => {
  expect(validateMarkdownIndex("[A](other.md)", ["a.md"], "docs/README.md")).toEqual([
    "docs/README.md must link a.md.",
  ]);
});

test("does not count links inside code examples", () => {
  expect(validateMarkdownIndex("```md\n[Example](a.md)\n```", ["a.md"], "docs/README.md")).toEqual([
    "docs/README.md must link a.md.",
  ]);
});
