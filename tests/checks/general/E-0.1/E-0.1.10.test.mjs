import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.10.mjs";

test("requires a Knit deployment configuration", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-config-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(join(root, ".knit", "deploy.yaml"), "version: 1\n");
    await expect(run({ root })).resolves.toEqual({
      ruleId: "E-0.1.10",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails when the Knit deployment configuration is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-config-missing-"));
  try {
    await expect(run({ root })).resolves.toEqual({
      ruleId: "E-0.1.10",
      status: "fail",
      message: ".knit/deploy.yaml is required for Knit configuration.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects alternate and extra Knit workflow YAML files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-config-extra-"));
  const directory = join(root, ".knit");
  try {
    await mkdir(join(directory, "nested"), { recursive: true });
    await writeFile(join(directory, "deploy.yaml"), "version: 1\n");
    await writeFile(join(directory, "nested", "other.yml"), "version: 1\n");
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("nested/other.yml"),
    });
    await rm(join(directory, "nested", "other.yml"));
    await writeFile(join(directory, "deploy.yml"), "version: 1\n");
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("deploy.yml"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses repository inventory and fails when it cannot be read", async () => {
  await expect(
    run({
      root: "/repo",
      repositoryInventory: { repositoryFiles: async () => [".knit/deploy.yaml"] },
    }),
  ).resolves.toMatchObject({ status: "pass" });
  await expect(
    run({
      root: "/repo",
      repositoryInventory: {
        repositoryFiles: async () => {
          throw new Error("inventory failure");
        },
      },
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("inventory failure"),
  });
});
