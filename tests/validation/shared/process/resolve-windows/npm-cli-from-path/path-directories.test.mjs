import { expect, test } from "@jest/globals";
import parseWindowsPathDirectories from "../../../../../../src/validation/shared/process/resolve-windows/npm-cli-from-path/path-directories.mjs";
test("splits and normalizes quoted Windows PATH entries", () => {
  expect(parseWindowsPathDirectories(' C:\\tools ;"C:\\Program Files"\\ ;')).toEqual([
    "C:\\tools",
    "C:\\Program Files\\",
    "",
  ]);
});
