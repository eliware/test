import { beforeEach, expect, jest, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const isForbiddenPath = jest.fn();
const findRepositoryFiles = jest.fn();
const readSensitiveExemptions = jest.fn();
const isAllowedSensitiveFile = jest.fn();
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
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.6/inspect-sensitive-file.mjs",
  () => ({ isAllowedSensitiveFile }),
);

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.6/E-0.1.6.0.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  isForbiddenPath.mockReturnValue(false);
  findRepositoryFiles.mockResolvedValue(["README.md"]);
  readSensitiveExemptions.mockReturnValue(new Set());
  isAllowedSensitiveFile.mockReturnValue(false);
});

test("checks discovered paths against the requested rule exemptions", async () => {
  const packageJson = { eliware: { exempt: [] } };
  isForbiddenPath.mockReturnValueOnce(true);

  await expect(
    run({ root: "/repo", packageJson }, undefined, async () => "fixture"),
  ).resolves.toEqual({
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

  await expect(run({ root: "/repo" }, undefined, async () => "fixture")).resolves.toEqual({
    ruleId: "E-0.1.6.0",
    status: "fail",
    message: "Unauthorized secret or runtime-state paths found: credentials.json.",
  });
  expect(isForbiddenPath).toHaveBeenCalledTimes(files.length);
});

test("reads candidate files and accepts only verified secret-management content", async () => {
  findRepositoryFiles.mockResolvedValueOnce(["secrets/app.enc.yaml"]);
  isForbiddenPath.mockReturnValueOnce(true);
  isAllowedSensitiveFile.mockReturnValueOnce(true);
  const readText = jest.fn().mockResolvedValue("encrypted fixture");

  await expect(run({ root: "/repo" }, undefined, readText)).resolves.toMatchObject({
    status: "pass",
  });
  expect(readText).toHaveBeenCalledWith("/repo", "secrets/app.enc.yaml", undefined);
  expect(isAllowedSensitiveFile).toHaveBeenCalledWith("secrets/app.enc.yaml", "encrypted fixture");
});

test("reads candidate text through repository inventory", async () => {
  const repositoryInventory = {
    repositoryFiles: jest.fn().mockResolvedValue(["secrets/app.enc.yaml"]),
    readText: jest.fn().mockResolvedValue("encrypted fixture"),
  };
  findRepositoryFiles.mockResolvedValueOnce(["secrets/app.enc.yaml"]);
  isForbiddenPath.mockReturnValueOnce(true);
  isAllowedSensitiveFile.mockReturnValueOnce(true);

  await expect(run({ root: "/repo", repositoryInventory })).resolves.toMatchObject({
    status: "pass",
  });
  expect(repositoryInventory.readText).toHaveBeenCalledWith(join("/repo", "secrets/app.enc.yaml"));
});

test("reads candidate text from disk when no repository inventory is available", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-sensitive-path-"));
  try {
    await writeFile(join(root, "credentials.json"), "fixture");
    isForbiddenPath.mockReturnValueOnce(true);
    await expect(run({ root, files: ["credentials.json"] })).resolves.toMatchObject({
      status: "fail",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
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
