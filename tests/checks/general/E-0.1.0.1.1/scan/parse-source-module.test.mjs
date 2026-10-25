import { expect, jest, test } from "@jest/globals";
import { scanCommonJsSourceModule } from "../../../../../src/checks/general/E-0.1.0.1.1/scan/parse-source-module.mjs";

test("parses a source module and returns CommonJS findings", async () => {
  await expect(
    scanCommonJsSourceModule({
      root: "/repo",
      file: "code.mjs",
      readSource: async () => "const value = require('fs');",
    }),
  ).resolves.toEqual(["code.mjs: require()"]);
});

test("uses injected AST parsing with repository parser options", async () => {
  const parseAst = jest.fn(async () => ({ type: "Identifier", name: "__dirname" }));
  const readSource = jest.fn();
  await expect(
    scanCommonJsSourceModule({ root: "/repo", file: "code.js", parseAst, readSource }),
  ).resolves.toEqual(["code.js: CommonJS identifier __dirname"]);
  expect(parseAst).toHaveBeenCalledWith("/repo", "code.js", expect.any(Object));
  expect(readSource).not.toHaveBeenCalled();
});

test("reports module syntax errors", async () => {
  await expect(
    scanCommonJsSourceModule({
      root: "/repo",
      file: "code.mjs",
      readSource: async () => "const = ;",
    }),
  ).resolves.toEqual(
    expect.arrayContaining([expect.stringMatching(/^code\.mjs: invalid module syntax \(/)]),
  );
});

test("reports injected parser errors", async () => {
  await expect(
    scanCommonJsSourceModule({
      root: "/repo",
      file: "code.js",
      parseAst: async () => {
        throw new Error("parse failed");
      },
      readSource: async () => "",
    }),
  ).resolves.toEqual(["code.js: invalid module syntax (parse failed)"]);
});
