import { expect, jest, test } from "@jest/globals";
import { resolve } from "node:path";
import { ruleId, run } from "../../../src/checks/web/E-0.1.6.1.1.mjs";

function entry(name, directory = true) {
  return { name, isDirectory: () => directory };
}

test("accepts public assets and rejects custom web asset metadata", async () => {
  const repositoryInventory = {
    directoryEntries: jest.fn(async (path) =>
      path === resolve("C:/repo/public") ? [entry("images"), entry("logo.svg", false)] : [],
    ),
  };
  await expect(run({ root: "C:/repo", packageJson: {}, repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
  await expect(
    run({
      root: "C:/repo",
      packageJson: { eliware: { webRoot: "assets", webAssetExcludes: [] } },
      repositoryInventory,
    }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("package.json.eliware.webRoot"),
  });
  await expect(
    run({
      root: "C:/repo",
      packageJson: { eliware: { webRoot: "assets", webAssetExcludes: [] } },
      repositoryInventory,
    }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("package.json.eliware.webAssetExcludes"),
  });
});

test("rejects excluded directories at every depth", async () => {
  const repositoryInventory = {
    directoryEntries: jest.fn(async (path) => {
      if (path === resolve("/repo/public")) return [entry("images"), entry("dist")];
      if (path === resolve("/repo/public/images")) return [entry(".git")];
      return [];
    }),
  };
  await expect(run({ root: resolve("/repo"), repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message:
      "Web public assets must not include excluded directory: public/images/.git.\n" +
      "Web public assets must not include excluded directory: public/dist.",
  });
});

test("requires the public directory", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
  const repositoryInventory = {
    directoryEntries: jest.fn().mockRejectedValue(new Error("missing")),
  };
  await expect(run({ root: "/repo", repositoryInventory })).resolves.toMatchObject({
    status: "fail",
    message: "public/ is required as the web asset root.",
  });
});
