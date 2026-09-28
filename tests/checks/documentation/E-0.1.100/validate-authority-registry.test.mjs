import { beforeEach, expect, jest, test } from "@jest/globals";

const validateAuthorityRegistryShape = jest.fn();
const validateAuthorityRegistryEntryShape = jest.fn();
const validateAuthorityRegistryReferences = jest.fn();
const validateAuthorityRegistryGovernance = jest.fn();
const validateAuthorityRegistryDelegation = jest.fn();
const validateAuthorityRegistryDirectiveNamespaces = jest.fn();

jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-shape.mjs",
  () => ({ validateAuthorityRegistryShape, validateAuthorityRegistryEntryShape }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-references.mjs",
  () => ({ validateAuthorityRegistryReferences }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-governance.mjs",
  () => ({ validateAuthorityRegistryGovernance }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-delegation.mjs",
  () => ({ validateAuthorityRegistryDelegation }),
);
jest.unstable_mockModule(
  "../../../../src/checks/documentation/E-0.1.100/validate-authority-registry-directive-namespaces.mjs",
  () => ({ validateAuthorityRegistryDirectiveNamespaces }),
);

const { validateAuthorityRegistry } =
  await import("../../../../src/checks/documentation/E-0.1.100/validate-authority-registry.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  validateAuthorityRegistryShape.mockReturnValue(null);
  validateAuthorityRegistryEntryShape.mockReturnValue(null);
  validateAuthorityRegistryReferences.mockResolvedValue(null);
  validateAuthorityRegistryGovernance.mockReturnValue(null);
  validateAuthorityRegistryDelegation.mockReturnValue(null);
  validateAuthorityRegistryDirectiveNamespaces.mockReturnValue(null);
});

test("returns top-level failures and skips only malformed entries", async () => {
  validateAuthorityRegistryShape.mockReturnValueOnce("registry invalid");
  await expect(validateAuthorityRegistry({ entries: null })).resolves.toBe("registry invalid");
  expect(validateAuthorityRegistryEntryShape).not.toHaveBeenCalled();

  validateAuthorityRegistryEntryShape.mockReturnValueOnce("entry invalid");
  await expect(validateAuthorityRegistry({ entries: [{}] })).resolves.toBe("entry invalid");
  expect(validateAuthorityRegistryReferences).not.toHaveBeenCalled();

  validateAuthorityRegistryShape.mockReturnValueOnce("top-level issue");
  await expect(
    validateAuthorityRegistry({ entries: [{ repository: "eliware/example" }] }),
  ).resolves.toContain("top-level issue");
  expect(validateAuthorityRegistryReferences).toHaveBeenCalled();
});

async function expectEntryFailure(validator, message) {
  validator.mockReturnValueOnce(message);
  await expect(
    validateAuthorityRegistry({
      root: "/repo",
      file: "/repo/authority-map.json",
      entries: [{ repository: "eliware/example" }],
    }),
  ).resolves.toContain(message);
  expect(validator).toHaveBeenCalledTimes(1);
}

test("returns reference errors without running later checks", async () => {
  await expectEntryFailure(validateAuthorityRegistryReferences, "reference invalid");
  expect(validateAuthorityRegistryGovernance).toHaveBeenCalled();
  expect(validateAuthorityRegistryDelegation).toHaveBeenCalled();
  expect(validateAuthorityRegistryDirectiveNamespaces).toHaveBeenCalled();
});

test("returns governance errors without running later checks", async () => {
  await expectEntryFailure(validateAuthorityRegistryGovernance, "governance invalid");
  expect(validateAuthorityRegistryDelegation).toHaveBeenCalled();
  expect(validateAuthorityRegistryDirectiveNamespaces).toHaveBeenCalled();
});

test("returns delegation errors without running namespace checks", async () => {
  await expectEntryFailure(validateAuthorityRegistryDelegation, "delegation invalid");
  expect(validateAuthorityRegistryDirectiveNamespaces).toHaveBeenCalled();
});

test("returns namespace errors", async () => {
  await expectEntryFailure(validateAuthorityRegistryDirectiveNamespaces, "namespace invalid");
});

test("validates entries in order with shared repository and governance sets", async () => {
  const entries = [{ repository: "eliware/one" }, { repository: "eliware/two" }];
  await expect(
    validateAuthorityRegistry({ root: "/repo", file: "/repo/map.json", entries }),
  ).resolves.toBeNull();

  expect(validateAuthorityRegistryEntryShape).toHaveBeenCalledTimes(2);
  expect(validateAuthorityRegistryReferences).toHaveBeenCalledTimes(2);
  expect(validateAuthorityRegistryGovernance).toHaveBeenCalledTimes(2);
  const repositories = validateAuthorityRegistryDelegation.mock.calls[0][1];
  expect(repositories).toEqual(new Set(["eliware/one", "eliware/two"]));
  expect(validateAuthorityRegistryDelegation).toHaveBeenCalledTimes(2);
  expect(validateAuthorityRegistryDirectiveNamespaces).toHaveBeenCalledTimes(2);
});
