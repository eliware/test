import { expect, test } from "@jest/globals";
import { isAllowedLibraryBarrelCoverageException } from "../../../../../src/checks/application/E-0.1.4.1.3/validate/barrel-exception.mjs";

test("allows Istanbul directives only for an eligible pure library barrel", () => {
  expect(
    isAllowedLibraryBarrelCoverageException("/* istanbul ignore file */", {
      allowLibraryBarrel: true,
      pureExportBarrel: true,
    }),
  ).toBe(true);
});

test("does not allow the exception without library context", () => {
  expect(isAllowedLibraryBarrelCoverageException("/* istanbul ignore file */")).toBe(false);
});

test.each([
  [{ allowLibraryBarrel: false, pureExportBarrel: true }, "/* istanbul ignore file */"],
  [{ allowLibraryBarrel: true, pureExportBarrel: false }, "/* istanbul ignore file */"],
  [{ allowLibraryBarrel: true, pureExportBarrel: true }, "/* c8 ignore file */"],
])("rejects ineligible coverage exceptions %#", (options, content) => {
  expect(isAllowedLibraryBarrelCoverageException(content, options)).toBe(false);
});
