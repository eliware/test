import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.6/E-0.1.6.0.mjs";

test("passes when current files contain no forbidden artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  try {
    await writeFile(join(root, "README.md"), "Public documentation.");
    await expect(run({ root })).resolves.toEqual({
      ruleId: "E-0.1.6.0",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("detects forbidden files present on disk and honors exact exemptions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  try {
    await writeFile(join(root, "credentials.json"), "secret");
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("credentials.json"),
    });
    const packageJson = {
      eliware: {
        exempt: [
          {
            ruleId: "E-0.1.6.0",
            path: "credentials.json",
            reason: "approved test fixture",
            approver: "Eli",
            approvalTimestamp: "2026-09-24T00:00:00Z",
            expiry: null,
          },
        ],
      },
    };
    await expect(run({ root, packageJson })).resolves.toEqual({
      ruleId: "E-0.1.6.0",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not let malformed direct-call exemption records suppress forbidden paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-exemption-"));
  try {
    await writeFile(join(root, "credentials.json"), "secret");
    const packageJson = {
      eliware: { exempt: [{ ruleId: "E-0.1.6.0", path: "credentials.json" }] },
    };
    await expect(run({ root, packageJson })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("credentials.json"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses the shared on-disk inventory when provided", async () => {
  const repositoryInventory = { repositoryFiles: async () => ["credentials.json"] };
  await expect(run({ root: "/repo", repositoryInventory })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("credentials.json"),
  });
});

test("fails safely when current repository files cannot be enumerated", async () => {
  await expect(
    run({ root: "/repo" }, async () => {
      throw new Error("filesystem unavailable");
    }),
  ).resolves.toEqual({
    ruleId: "E-0.1.6.0",
    status: "fail",
    message: "Repository contents could not be inspected for secret or runtime-state artifacts.",
  });
});

test("allows the root local .env file while rejecting other ignored secret paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-ignore-"));
  try {
    await writeFile(join(root, ".gitignore"), ".env*\ncredentials.json\n");
    await writeFile(join(root, ".env"), "local state");
    await writeFile(join(root, "credentials.json"), "secret");
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("credentials.json"),
    });
    await rm(join(root, "credentials.json"));
    await expect(run({ root })).resolves.toMatchObject({
      ruleId: "E-0.1.6.0",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
