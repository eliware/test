import { beforeEach, expect, jest, test } from "@jest/globals";
const createRepositoryFileViews = jest.fn();
const createDocumentationFileView = jest.fn();
const createRepositoryDirectoryEntries = jest.fn();
jest.unstable_mockModule(
  "../../../../../../src/validation/shared/repository/create-repository/inventory/views.mjs",
  () => ({ default: createRepositoryFileViews }),
);
jest.unstable_mockModule(
  "../../../../../../src/validation/shared/repository/create-repository/inventory/documentation.mjs",
  () => ({ default: createDocumentationFileView }),
);
jest.unstable_mockModule(
  "../../../../../../src/validation/shared/repository/create-repository/directory/entries.mjs",
  () => ({ default: createRepositoryDirectoryEntries }),
);
const createRepositoryInventoryCapabilities = (
  await import("../../../../../../src/validation/shared/repository/create-repository/inventory/capabilities.mjs")
).default;
beforeEach(() => jest.resetAllMocks());
test("constructs the file, documentation, and directory capability groups", () => {
  const discovery = {
    entries: jest.fn(),
    entriesUnder: jest.fn(),
    readDirectoryCached: jest.fn(),
    hasFullDiscovery: jest.fn(),
  };
  const fileViews = { files: jest.fn() };
  const documentationFiles = jest.fn();
  const directoryEntries = jest.fn();
  createRepositoryFileViews.mockReturnValue(fileViews);
  createDocumentationFileView.mockReturnValue(documentationFiles);
  createRepositoryDirectoryEntries.mockReturnValue(directoryEntries);
  const options = {
    root: "/repo",
    discovery,
    focusedScope: { paths: ["src/a.mjs"] },
    statDirectory: jest.fn(),
  };
  expect(createRepositoryInventoryCapabilities(options)).toEqual({
    ...fileViews,
    documentationFiles,
    directoryEntries,
  });
  expect(createRepositoryFileViews).toHaveBeenCalledWith(
    discovery.entries,
    options.focusedScope,
    options.root,
  );
  expect(createRepositoryDirectoryEntries).toHaveBeenCalledWith(
    expect.objectContaining({
      entries: discovery.entries,
      entriesUnder: discovery.entriesUnder,
      readDirectory: discovery.readDirectoryCached,
      hasFullDiscovery: discovery.hasFullDiscovery,
    }),
  );
});
