import { beforeEach, expect, jest, test } from "@jest/globals";

const validateAuthorityMapPaths = jest.fn();
const validateAuthorityReciprocity = jest.fn();
const validateAuthorityRegistry = jest.fn();

jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-map-paths.mjs",
  () => ({ validateAuthorityMapPaths }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-reciprocity.mjs",
  () => ({ validateAuthorityReciprocity }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry.mjs",
  () => ({ validateAuthorityRegistry }),
);

const { validateAuthorityMap } =
  await import("../../../../src/checks/documentation/E-0.1.100/validate-authority-map.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  validateAuthorityRegistry.mockResolvedValue(null);
  validateAuthorityReciprocity.mockResolvedValue(null);
  validateAuthorityMapPaths.mockResolvedValue(null);
});

test("requires a structured authority-map document", async () => {
  await expect(validateAuthorityMap({ document: null })).resolves.toBe(
    "authority-map.json must declare repositoryRegistry.",
  );
  expect(validateAuthorityRegistry).not.toHaveBeenCalled();
});

test("validates registry, reciprocity, and paths in order", async () => {
  const context = {
    root: "/repo",
    file: "/repo/authority-map.json",
    inventory: { readParsed: jest.fn() },
    document: {
      repositoryRegistry: [{ repository: "eliware/example" }],
      crosslinks: [{ path: "README.md" }],
      structuredDocuments: [{ path: "specs/authority.json" }],
    },
  };

  await expect(validateAuthorityMap(context)).resolves.toBeNull();
  expect(validateAuthorityRegistry).toHaveBeenCalledWith({
    root: context.root,
    file: context.file,
    entries: context.document.repositoryRegistry,
  });
  expect(validateAuthorityReciprocity).toHaveBeenCalledWith({
    root: context.root,
    file: context.file,
    entries: context.document.repositoryRegistry,
    inventory: context.inventory,
  });
  expect(validateAuthorityMapPaths).toHaveBeenCalledWith({
    root: context.root,
    file: context.file,
    crosslinks: context.document.crosslinks,
    structuredDocuments: context.document.structuredDocuments,
    repositoryRegistry: context.document.repositoryRegistry,
    inventory: context.inventory,
  });
  const phaseOrder = [
    validateAuthorityRegistry.mock.invocationCallOrder[0],
    validateAuthorityReciprocity.mock.invocationCallOrder[0],
    validateAuthorityMapPaths.mock.invocationCallOrder[0],
  ];
  expect(phaseOrder).toEqual([...phaseOrder].sort((left, right) => left - right));
});

test("stops at the first delegated validation failure", async () => {
  const context = { root: "/repo", file: "/repo/map.json", document: { repositoryRegistry: [] } };
  validateAuthorityRegistry.mockResolvedValueOnce("registry invalid");
  await expect(validateAuthorityMap(context)).resolves.toBe("registry invalid");
  expect(validateAuthorityReciprocity).not.toHaveBeenCalled();

  validateAuthorityReciprocity.mockResolvedValueOnce("reciprocal authority invalid");
  await expect(validateAuthorityMap(context)).resolves.toBe("reciprocal authority invalid");
  expect(validateAuthorityMapPaths).not.toHaveBeenCalled();
});
