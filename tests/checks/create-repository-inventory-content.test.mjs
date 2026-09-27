import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { createRepositoryInventory } from "../../src/checks/create-repository-inventory.mjs";
import { moduleParserOptions } from "../../src/checks/create-repository-ast-cache.mjs";

test("shares one file read across text, byte, parsed-document, and AST access", async () => {
  const read = jest.fn(async (filePath) => {
    if (filePath.endsWith("package.json")) return Buffer.from('{"name":"fixture"}');
    if (filePath.endsWith("icon.png")) return Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    return Buffer.from("export const value = 1;");
  });
  const parseSource = jest.fn(() => ({ type: "File" }));
  const inventory = createRepositoryInventory("/repo", { read, parseSource });

  const text = await inventory.readText("src/index.mjs");
  const bytes = await inventory.readBytes("src/index.mjs");
  const parsed = await inventory.readParsed("package.json", "json", JSON.parse);
  const parsedAgain = await inventory.readParsed(join("/repo", "package.json"), "json", JSON.parse);
  const ast = await inventory.parseAst("/repo", "src/index.mjs", moduleParserOptions);
  const astAgain = await inventory.parseAst("/repo", "src/index.mjs", moduleParserOptions);
  const image = await inventory.readBytes("docs/icon.png");
  const imageAgain = await inventory.readBytes(join("/repo", "docs", "icon.png"));

  expect(text).toBe("export const value = 1;");
  expect(bytes).toEqual(Buffer.from(text));
  expect(parsed).toEqual({ name: "fixture" });
  expect(parsedAgain).toBe(parsed);
  expect(astAgain).toBe(ast);
  expect(imageAgain).toBe(image);
  expect(read).toHaveBeenCalledTimes(3);
  expect(parseSource).toHaveBeenCalledTimes(1);
});
test("uses the default source parser when no parser is injected", async () => {
  const inventory = createRepositoryInventory("/repo", {
    read: jest.fn(async () => "export const value = 1;"),
  });

  await expect(inventory.parseAst("/repo", "src/index.mjs", moduleParserOptions)).resolves.toMatchObject({
    type: "File",
  });
});
