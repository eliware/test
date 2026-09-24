import { beforeEach, expect, jest, test } from "@jest/globals";

const inspectLocalMailboxOwner = jest.fn();
const findRepositoryFiles = jest.fn();
const resolveMailboxTemplateFiles = jest.fn();
const validateMailboxTemplates = jest.fn();
jest.unstable_mockModule("../../../../src/checks/general/E-1/inspect-local-mailbox-owner.mjs", () => ({ inspectLocalMailboxOwner }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/find-repository-files.mjs", () => ({ findRepositoryFiles }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/resolve-mailbox-template-files.mjs", () => ({ resolveMailboxTemplateFiles }));
jest.unstable_mockModule("../../../../src/checks/general/E-1/validate-mailbox-templates.mjs", () => ({ validateMailboxTemplates }));

const { run } = await import("../../../../src/checks/general/E-1/E-1.8.mjs");

beforeEach(() => {
  jest.resetAllMocks();
  inspectLocalMailboxOwner.mockResolvedValue({ trackedFiles: [".env"] });
  findRepositoryFiles.mockResolvedValue([".env.example"]);
  resolveMailboxTemplateFiles.mockReturnValue([".env.example"]);
  validateMailboxTemplates.mockResolvedValue(null);
});

test("derives the owner and composes local and template validation", async () => {
  await expect(run({
    root: "/repo",
    packageJson: { name: "@eliware/fixture" },
    trackedFiles: [".env"],
    readTracked: [".env"],
    checkIgnored: jest.fn(),
  })).resolves.toEqual({ ruleId: "E-1.8", status: "pass", message: "" });
  expect(inspectLocalMailboxOwner).toHaveBeenCalledWith("/repo", "fixture@eliware.org", {
    trackedFiles: [".env"],
    readTracked: [".env"],
    checkIgnored: expect.any(Function),
  });
  expect(findRepositoryFiles).toHaveBeenCalledWith("/repo");
  expect(resolveMailboxTemplateFiles).toHaveBeenCalledWith([".env.example"], [".env"]);
  expect(validateMailboxTemplates).toHaveBeenCalledWith("/repo", [".env.example"]);
});

test("requires package identity and stops after a local-owner failure", async () => {
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.8",
    status: "fail",
    message: "package.json.name is required to derive the mailbox owner.",
  });
  expect(inspectLocalMailboxOwner).not.toHaveBeenCalled();

  inspectLocalMailboxOwner.mockResolvedValueOnce({ error: "local owner invalid" });
  await expect(run({ root: "/repo", packageJson: { name: "fixture" } })).resolves.toEqual({
    ruleId: "E-1.8",
    status: "fail",
    message: "local owner invalid",
  });
  expect(findRepositoryFiles).not.toHaveBeenCalled();
});

test("maps template discovery and validation errors to the rule result", async () => {
  findRepositoryFiles.mockRejectedValueOnce(new Error("scan failed"));
  await expect(run({ root: "/repo", packageJson: { name: "fixture" } })).resolves.toMatchObject({
    status: "fail",
    message: "Environment files could not be inspected: scan failed",
  });
  validateMailboxTemplates.mockResolvedValueOnce("template invalid");
  await expect(run({ root: "/repo", packageJson: { name: "fixture" } })).resolves.toMatchObject({
    status: "fail",
    message: "template invalid",
  });
});
