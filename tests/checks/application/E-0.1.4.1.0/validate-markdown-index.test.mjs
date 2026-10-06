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
    "docs/README.md links to unexpected target other.md.",
  ]);
});

test("does not count links inside code examples", () => {
  expect(validateMarkdownIndex("```md\n[Example](a.md)\n```", ["a.md"], "docs/README.md")).toEqual([
    "docs/README.md must link a.md.",
  ]);
});

test("does not count links inside indented code", () => {
  expect(validateMarkdownIndex("    [Example](a.md)", ["a.md"], "docs/README.md")).toEqual([
    "docs/README.md must link a.md.",
  ]);
});

test("does not count image sources as links", () => {
  expect(
    validateMarkdownIndex('![Example](a.md) <img src="a.md">', ["a.md"], "docs/README.md"),
  ).toEqual(["docs/README.md must link a.md."]);
});

test("requires each discovered target exactly once and rejects extras", () => {
  expect(
    validateMarkdownIndex(
      "[A](a.md) [A again](a.md) [Extra](other.md)",
      ["a.md"],
      "docs/README.md",
    ),
  ).toEqual([
    "docs/README.md links to unexpected target other.md.",
    "docs/README.md must link each target only once.",
  ]);
});

test("rejects links with incorrect path casing and unresolved references", () => {
  expect(validateMarkdownIndex("[A](A.md) [missing][x]", ["a.md"], "docs/README.md")).toEqual([
    "docs/README.md must link a.md.",
    "docs/README.md links to unexpected target A.md.",
    "docs/README.md links to unexpected target an undefined reference.",
  ]);
});
