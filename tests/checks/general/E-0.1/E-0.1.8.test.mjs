import { beforeEach, expect, jest, test } from "@jest/globals";

const findRepositoryFiles = jest.fn();
const resolveMailboxTemplateFiles = jest.fn();
const validateMailboxTemplates = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-0.1/find-repository-files.mjs", () => ({
  findRepositoryFiles,
}));
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/resolve-mailbox-template-files.mjs",
  () => ({ resolveMailboxTemplateFiles }),
);
jest.unstable_mockModule(
  "../../../../src/checks/general/E-0.1/validate-mailbox-templates.mjs",
  () => ({ validateMailboxTemplates }),
);

const { run } = await import("../../../../src/checks/general/E-0.1/E-0.1.8.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  findRepositoryFiles.mockResolvedValue([".env.example"]);
  resolveMailboxTemplateFiles.mockReturnValue([".env.example"]);
  validateMailboxTemplates.mockResolvedValue(null);
});

test("composes environment-template validation", async () => {
  await expect(
    run({
      root: "/repo",
      checkIgnored: jest.fn(),
    }),
  ).resolves.toEqual({ ruleId: "E-0.1.8", status: "pass", message: "" });
  expect(findRepositoryFiles).toHaveBeenCalledWith("/repo");
  expect(resolveMailboxTemplateFiles).toHaveBeenCalledWith(
    "/repo",
    [".env.example"],
    expect.any(Function),
  );
  expect(validateMailboxTemplates).toHaveBeenCalledWith("/repo", [".env.example"], null);
});

test("uses the shared file list when inventory context is supplied", async () => {
  const repositoryInventory = { repositoryFiles: jest.fn(async () => [".env.example"]) };
  await expect(run({ root: "/repo", repositoryInventory })).resolves.toMatchObject({
    status: "pass",
  });
  expect(repositoryInventory.repositoryFiles).toHaveBeenCalledTimes(1);
  expect(resolveMailboxTemplateFiles).toHaveBeenCalledWith("/repo", [".env.example"], undefined);
  expect(validateMailboxTemplates).toHaveBeenCalledWith("/repo", [".env.example"], {
    repositoryInventory,
  });
});

test("maps template discovery and validation errors to the rule result", async () => {
  findRepositoryFiles.mockRejectedValueOnce(new Error("scan failed"));
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "Environment files could not be inspected: scan failed",
  });
  validateMailboxTemplates.mockResolvedValueOnce("template invalid");
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "template invalid",
  });
});
