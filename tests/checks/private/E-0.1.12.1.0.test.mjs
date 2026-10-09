import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/private/E-0.1.12.1.0.mjs";

const repositoryInventory = {
  files: async () => [],
  readText: async () => "## Private distribution",
};

test("E-0.1.12.1.0 accepts Private with GHCR publication", async () => {
  await expect(
    run({
      packageJson: {
        private: true,
        eliware: { apply: ["general", "private", "ghcr-published"] },
      },
      repositoryInventory,
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test.each([undefined, false, "true"])("rejects package.json.private value %s", async (value) => {
  await expect(run({ packageJson: { private: value }, repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Private repositories must set package.json.private to true.",
  });
});

test("rejects a missing package manifest", async () => {
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "fail",
    message: "Private repositories must set package.json.private to true.",
  });
});

test("uses its default context", async () => {
  await expect(run()).resolves.toMatchObject({ ruleId, status: "fail" });
});

test("rejects npm publication commands and token settings in package scripts", async () => {
  const result = await run({
    packageJson: {
      private: true,
      scripts: { publish: "npm publish", token: "NODE_AUTH_TOKEN=value" },
    },
    repositoryInventory,
  });
  expect(result).toEqual({
    ruleId,
    status: "fail",
    message:
      "package.json.scripts.publish must not run an npm publication command.\n" +
      "package.json.scripts.token must not set or reference npm publication tokens.",
  });
});

test("allows GHCR publication in a workflow for a Private repository", async () => {
  const path = ".github/workflows/publish.yaml";
  const inventory = {
    files: async () => [path],
    readText: async (file) =>
      file === "AGENTS.md"
        ? "## Private distribution"
        : "jobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/eliware/app\n",
  };
  await expect(
    run({ packageJson: { private: true }, repositoryInventory: inventory }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});
