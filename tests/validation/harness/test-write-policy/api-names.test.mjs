import { expect, test } from "@jest/globals";
import {
  fileMutationApis,
  filesystemModules,
  restrictedModules,
  temporaryDirectoryApis,
  temporaryDirectoryModules,
} from "../../../../src/validation/harness/test-write-policy/api-names.mjs";

test("lists filesystem mutation and temporary directory APIs", () => {
  expect(fileMutationApis.has("writeFile")).toBe(true);
  expect(fileMutationApis.has("mkdir")).toBe(true);
  expect(fileMutationApis.has("rm")).toBe(true);
  expect(temporaryDirectoryApis.has("tmpdir")).toBe(true);
  expect(filesystemModules.has("node:fs/promises")).toBe(true);
  expect(temporaryDirectoryModules.has("node:os")).toBe(true);
  expect(restrictedModules.has("node:os")).toBe(true);
});
