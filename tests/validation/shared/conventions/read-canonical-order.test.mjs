import { expect, test } from "@jest/globals";
import { readCanonicalOrder } from "../../../../src/validation/shared/conventions/read-canonical-order.mjs";

test("reads structured canonical order data", () => {
  expect(readCanonicalOrder("eliware-apply.yaml").profiles).toEqual([
    "general",
    "documentation",
    "workspace",
    "library",
    "application",
    "cli",
    "web",
    "discord",
    "mcp-server",
    "infrastructure",
    "npm-published",
    "ghcr-published",
    "private",
  ]);
});

test("rejects paths outside the ordering specification names", () => {
  expect(() => readCanonicalOrder("../directives.yaml")).toThrow(
    "Invalid canonical ordering file name.",
  );
});

test("rejects an ordering document with the wrong version", () => {
  expect(() =>
    readCanonicalOrder("invalid.yaml", () => "version: '11.0'\norders: { fields: [a] }"),
  ).toThrow("Invalid canonical ordering specification: invalid.yaml.");
});
