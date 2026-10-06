import { expect, test } from "@jest/globals";
import { findCommonJsUses } from "../../../../src/checks/general/E-0.1.0.1.1/find-commonjs-uses.mjs";

test("reports CommonJS package entrypoints", async () => {
  await expect(findCommonJsUses("/repo", { exports: "./index.cjs" }, [], null)).resolves.toEqual([
    "package.json: CommonJS entrypoint or export",
  ]);
});

test("reports unique source findings", async () => {
  const parseAst = async () => ({
    type: "CallExpression",
    callee: { type: "Identifier", name: "require" },
  });
  await expect(findCommonJsUses("/repo", {}, ["file.js"], parseAst)).resolves.toEqual([
    "file.js: require()",
  ]);
});

test("reports inventory failures", async () => {
  await expect(findCommonJsUses("missing", {}, undefined, null)).resolves.toEqual([
    expect.stringContaining("Repository modules could not be inspected"),
  ]);
});

test("accepts an absent package manifest", async () => {
  await expect(findCommonJsUses("/repo", undefined, [], null)).resolves.toEqual([]);
});
