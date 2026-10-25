import { expect, jest, test } from "@jest/globals";
import { join } from "node:path";
import { scanCommonJsFile } from "../../../../../src/checks/general/E-0.1.0.1.1/scan/commonjs-file.mjs";

test("skips non-module files and rejects CommonJS extensions", async () => {
  const read = jest.fn();
  expect(await scanCommonJsFile("/repo", "README.md", null, read)).toEqual([]);
  expect(await scanCommonJsFile("/repo", "entry.cjs", null, read)).toEqual([
    "entry.cjs: CommonJS module extension",
  ]);
  expect(read).not.toHaveBeenCalled();
});

test("reads and parses one maintained module", async () => {
  const read = jest.fn().mockResolvedValue("const value = require('fs');");
  await expect(scanCommonJsFile("/repo", "index.mjs", null, read)).resolves.toEqual([
    "index.mjs: require()",
  ]);
  expect(read).toHaveBeenCalledWith(join("/repo", "index.mjs"), "utf8");
});

test("uses the injected repository parser and returns syntax findings", async () => {
  const parseAst = jest.fn().mockRejectedValue(new Error("invalid syntax"));
  const read = jest.fn();
  await expect(scanCommonJsFile("/repo", "index.js", parseAst, read)).resolves.toEqual([
    "index.js: invalid module syntax (invalid syntax)",
  ]);
  expect(parseAst).toHaveBeenCalledWith("/repo", "index.js", expect.any(Object));
  expect(read).not.toHaveBeenCalled();
});
