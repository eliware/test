import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/general/E-0.1.0.1.6.mjs";

const inventory = {
  files: async () => [".knit/deploy.yaml", ".knit/secondary.mjs"],
  readText: async () =>
    "version: 1\non:\n  push:\n    commands:\n      - git pull --ff-only origin main\n      - npm ci\n      - npm test\n",
};

test("accepts the required Knit command prefix", async () => {
  await expect(run({ repositoryInventory: inventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports invalid Knit files and command lists", async () => {
  const result = await run({
    repositoryInventory: {
      files: async () => [".knit/deploy.yaml", ".knit/extra.yml"],
      readText: async () =>
        "commands: [npm test, npm ci, npm test, npm publish]\nextra:\n  commands: nope\n",
    },
  });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("only YAML file");
  expect(result.message).toContain("must begin");
  expect(result.message).toContain("must be an array of strings");
  expect(result.message).toContain("must not publish");
});

test("rejects missing inventory, missing files, and invalid YAML", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
  await expect(
    run({ repositoryInventory: { files: async () => [], readText: async () => "" } }),
  ).resolves.toMatchObject({ message: expect.stringContaining("only YAML file") });
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".knit/deploy.yaml"],
        readText: async () => "a: [",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("could not be parsed") });
});

test("rejects multiple YAML documents and CodeScope commands", async () => {
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".knit/deploy.yaml"],
        readText: async () => "commands: []\n---\ncommands: [codescope run]",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("exactly one document") });
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".knit/deploy.yaml"],
        readText: async () =>
          "commands: [git pull --ff-only origin main, npm ci, npm test, codescope run]",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("must not invoke CodeScope") });
});

test("rejects missing commands, non-string items, and publishing commands", async () => {
  const validate = (source) =>
    run({
      repositoryInventory: {
        files: async () => [".knit/deploy.yaml"],
        readText: async () => source,
      },
    });
  await expect(validate("version: 1")).resolves.toMatchObject({
    message: expect.stringContaining("must define commands fields"),
  });
  await expect(validate("commands: [1, npm ci, npm test]")).resolves.toMatchObject({
    message: expect.stringContaining("array of strings"),
  });
  await expect(
    validate(
      "commands: [git pull --ff-only origin main, npm ci, npm test, docker push ghcr.io/team/image]",
    ),
  ).resolves.toMatchObject({
    message: expect.stringContaining("must not publish npm packages or GHCR images"),
  });
  await expect(
    validate(
      "commands: [git pull --ff-only origin main, npm ci, npm test, node scripts/helper.mjs]",
    ),
  ).resolves.toMatchObject({
    message: expect.stringContaining("keep secondary scripts under .knit/"),
  });
  await expect(
    validate("commands: [git pull --ff-only origin main, npm ci, npm test, node .knit/helper.mjs]"),
  ).resolves.toMatchObject({ status: "pass" });
});

test("reports inventory read failures", async () => {
  await expect(
    run({
      repositoryInventory: {
        files: async () => {
          throw new Error("denied");
        },
        readText: async () => "",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("could not be inspected: denied") });
});
