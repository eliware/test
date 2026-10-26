import { expect, jest, test } from "@jest/globals";

const readdir = jest.fn();
const scanCommonJsFile = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readdir }));
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1.0.1.1/scan/commonjs-file.mjs",
  () => ({ scanCommonJsFile }),
);

const { scanCommonJsFiles } =
  await import("../../../../src/checks/general/E-0.1.0.1.1/scan-commonjs-files.mjs");

test("scans each file from the repository inventory", async () => {
  readdir.mockResolvedValue([{ name: "index.js", isDirectory: () => false, isFile: () => true }]);
  scanCommonJsFile.mockResolvedValue(["index.js: require()"]);

  await expect(scanCommonJsFiles("/repo", null, null)).resolves.toEqual(["index.js: require()"]);
  expect(readdir).toHaveBeenCalledWith("/repo", { withFileTypes: true });
  expect(scanCommonJsFile).toHaveBeenCalledWith("/repo", "index.js", null);
});
