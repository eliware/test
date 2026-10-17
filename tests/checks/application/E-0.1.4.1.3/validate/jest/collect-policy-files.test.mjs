import { expect, test } from "@jest/globals";
import { join } from "node:path";
import { collectJestPolicyFiles } from "../../../../../../src/checks/application/E-0.1.4.1.3/validate/jest/collect-policy-files.mjs";

test("selects policy paths and reads their content", async () => {
  const inventory = {
    files: async () => ["package.json", "src/index.mjs", "docs/readme.md", "jest.config.mjs"],
    readText: async (path) => `text:${path}`,
  };
  await expect(collectJestPolicyFiles(inventory, "repo")).resolves.toEqual({
    errors: [],
    files: [
      { path: "package.json", content: `text:${join("repo", "package.json")}` },
      { path: "src/index.mjs", content: `text:${join("repo", "src/index.mjs")}` },
      { path: "jest.config.mjs", content: `text:${join("repo", "jest.config.mjs")}` },
    ],
    paths: ["package.json", "src/index.mjs", "docs/readme.md", "jest.config.mjs"],
  });
});

test("reports inventory failures", async () => {
  await expect(
    collectJestPolicyFiles(
      {
        files: async () => {
          throw new Error("denied");
        },
      },
      "repo",
    ),
  ).resolves.toEqual({
    errors: ["Jest source policy could not read the repository inventory."],
    files: [],
  });
});

test("reports a policy file that cannot be read and continues", async () => {
  const inventory = {
    files: async () => ["src/broken.mjs", "src/ok.mjs"],
    readText: async (path) => {
      if (path.includes("broken")) throw new Error("denied");
      return "ok";
    },
  };
  await expect(collectJestPolicyFiles(inventory, "repo")).resolves.toMatchObject({
    errors: ["src/broken.mjs could not be read to check Jest source policy."],
    files: [{ path: "src/ok.mjs", content: "ok" }],
  });
});
