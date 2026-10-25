import { expect, jest, test } from "@jest/globals";

const readdir = jest.fn();
const readFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readdir, readFile }));

const { scanCommonJsFiles } =
  await import("../../../../src/checks/general/E-0.1.0.1.1/scan-commonjs-files.mjs");

test("reads maintained modules from the mocked repository inventory", async () => {
  readdir.mockResolvedValue([{ name: "index.js", isDirectory: () => false, isFile: () => true }]);
  readFile.mockResolvedValue("const value = require('fs');\n");

  await expect(scanCommonJsFiles("/repo", null, null)).resolves.toContain("index.js: require()");
  expect(readFile).toHaveBeenCalledTimes(1);
});
