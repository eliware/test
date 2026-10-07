import { beforeEach, expect, jest, test } from "@jest/globals";

const createRepositoryAstCache = jest.fn();
const createRepositoryFileContentCache = jest.fn();
const createRepositoryParsedContentCache = jest.fn();
jest.unstable_mockModule(
  "../../../../src/validation/shared/ast/create-repository-ast-cache.mjs",
  () => ({
    createRepositoryAstCache,
  }),
);
jest.unstable_mockModule(
  "../../../../src/validation/shared/repository/create-repository-file-content-cache.mjs",
  () => ({
    createRepositoryFileContentCache,
  }),
);
jest.unstable_mockModule(
  "../../../../src/validation/shared/repository/create-repository-parsed-content-cache.mjs",
  () => ({
    createRepositoryParsedContentCache,
  }),
);

const { createRepositoryContentCache } =
  await import("../../../../src/validation/shared/repository/create-repository-inventory-content.mjs");

beforeEach(() => {
  jest.resetAllMocks();
});

test("coordinates focused byte, text, parsed-content, and AST cache modules", () => {
  const readText = jest.fn();
  const readBytes = jest.fn();
  const content = { readText, readBytes };
  const readParsed = jest.fn();
  const parseAst = jest.fn();
  const read = jest.fn();
  const parseSource = jest.fn();
  createRepositoryFileContentCache.mockReturnValue(content);
  createRepositoryParsedContentCache.mockReturnValue(readParsed);
  createRepositoryAstCache.mockReturnValue(parseAst);

  expect(createRepositoryContentCache("/repo", read, parseSource)).toEqual({
    readText,
    readBytes,
    readParsed,
    parseAst,
  });
  expect(createRepositoryFileContentCache).toHaveBeenCalledWith("/repo", read);
  expect(createRepositoryParsedContentCache).toHaveBeenCalledWith("/repo", readText);
  expect(createRepositoryAstCache).toHaveBeenCalledWith({ read: readText, parseSource });
});

test("uses the default AST parser when no parser is supplied", () => {
  const readText = jest.fn();
  createRepositoryFileContentCache.mockReturnValue({ readText, readBytes: jest.fn() });
  createRepositoryParsedContentCache.mockReturnValue(jest.fn());
  createRepositoryAstCache.mockReturnValue(jest.fn());

  createRepositoryContentCache("/repo", jest.fn());

  expect(createRepositoryAstCache).toHaveBeenCalledWith({ read: readText });
});
