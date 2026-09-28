import { beforeEach, expect, jest, test } from "@jest/globals";

const isForbiddenPath = jest.fn();
const findRepositoryFiles = jest.fn();
const readSensitiveExemptions = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.6/sensitive-path-classifier.mjs",
  () => ({ isForbiddenPath }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/find-repository-files.mjs",
  () => ({ findRepositoryFiles }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.6/read-sensitive-exemptions.mjs",
  () => ({ readSensitiveExemptions }),
);

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.6/E-0.1.6.0.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  isForbiddenPath.mockReturnValue(false);
  findRepositoryFiles.mockResolvedValue(["README.md"]);
  readSensitiveExemptions.mockReturnValue(new Set());
});

test("checks discovered paths against the requested rule exemptions", async () => {
  const packageJson = { eliware: { exempt: [] } };
  isForbiddenPath.mockReturnValueOnce(true);

  await expect(run({ root: "/repo", packageJson })).resolves.toEqual({
    ruleId: "E-0.1.6.0",
    status: "fail",
    message: "Unauthorized secret or runtime-state paths found: README.md.",
  });
  expect(readSensitiveExemptions).toHaveBeenCalledWith(packageJson, "E-0.1.6.0");
  expect(findRepositoryFiles).toHaveBeenCalledWith("/repo");
  expect(isForbiddenPath).toHaveBeenCalledWith("README.md");
});

test("continues evaluating all paths and filters exact exempt paths", async () => {
  const files = ["credentials.json", "private.json", "README.md"];
  findRepositoryFiles.mockResolvedValueOnce(files);
  isForbiddenPath.mockImplementation((path) => path !== "README.md");
  readSensitiveExemptions.mockReturnValueOnce(new Set(["private.json"]));

  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.6.0",
    status: "fail",
    message: "Unauthorized secret or runtime-state paths found: credentials.json.",
  });
  expect(isForbiddenPath).toHaveBeenCalledTimes(files.length);
});

test("uses supplied files before inventory or disk discovery", async () => {
  const repositoryInventory = { repositoryFiles: jest.fn() };
  await expect(run({ root: "/repo", files: [], repositoryInventory })).resolves.toMatchObject({
    status: "pass",
  });
  expect(repositoryInventory.repositoryFiles).not.toHaveBeenCalled();
  expect(findRepositoryFiles).not.toHaveBeenCalled();

  await run({ root: "/repo", repositoryInventory });
  expect(repositoryInventory.repositoryFiles).toHaveBeenCalledTimes(1);
});

test("reports discovery failures without suppressing exemption preparation", async () => {
  findRepositoryFiles.mockRejectedValueOnce(new Error("filesystem unavailable"));

  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.6.0",
    status: "fail",
    message: "Repository contents could not be inspected for secret or runtime-state artifacts.",
  });
  expect(readSensitiveExemptions).toHaveBeenCalled();
});
