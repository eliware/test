import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/general/E-0.1.0.1.7.mjs";

const validWorkflow = `name: Validation
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
concurrency:
  group: \u0024{{ github.repository }}-\u0024{{ github.ref }}
  cancel-in-progress: true
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 26
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm test`;

const inventory = {
  files: async () => [".github/workflows/ci.yaml", ".github/workflows/publish.yaml"],
  readText: async () => validWorkflow,
};

test("accepts the required validation workflow and applied publication workflow", async () => {
  await expect(
    run({ repositoryInventory: inventory, packageJson: { eliware: { apply: ["npm-published"] } } }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("checks workflow file scope and required file presence", async () => {
  await expect(run({ repositoryInventory: inventory })).resolves.toMatchObject({
    message: expect.stringContaining("Unexpected workflow file"),
  });
  await expect(
    run({ repositoryInventory: { files: async () => [], readText: async () => "" } }),
  ).resolves.toMatchObject({ message: expect.stringContaining("ci.yaml is required") });
});

test("reports invalid workflow settings and steps", async () => {
  const badWorkflow = validWorkflow
    .replace("pull_request:\n    branches: [main]", "pull_request: {}")
    .replace("cancel-in-progress: true", "cancel-in-progress: false")
    .replace("contents: read", "contents: write")
    .replace("ubuntu-latest", "windows-latest")
    .replace("actions/checkout@v6", "actions/checkout@v5")
    .replace("node-version: 26", "node-version: 20")
    .replace("npm ci", "npm ci && npm test");
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => badWorkflow,
      },
    }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("must enable pull_request"),
  });
});

test("rejects missing inventory, malformed YAML, and multiple documents", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => "x: [",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("could not be parsed") });
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => "a: 1\n---\nb: 2",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("exactly one document") });
});

test("rejects unapproved steps, step overrides, and absent validation jobs", async () => {
  const badWorkflow = validWorkflow.replace(
    "      - run: npm ci",
    "      - run: curl https://example.invalid\n      - run: npm ci\n        env:\n          CI: true",
  );
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => badWorkflow,
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("unapproved step") });
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => "name: Validation\non: {}\njobs: {}",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("validation job with steps") });
});

test("accepts safe literal reporting and rejects unsafe reporting", async () => {
  const safe = validWorkflow.replace(
    "      - run: npm -g install npm@latest",
    "      - run: echo 'Install npm latest'\n      - run: npm -g install npm@latest",
  );
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => safe,
      },
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
  const unsafe = safe.replace("echo 'Install npm latest'", 'echo "$TOKEN"');
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => unsafe,
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("unapproved step") });
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

test("rejects multiple validation jobs, job conditions, and unsafe permissions", async () => {
  const invalid = validWorkflow
    .replace(
      "    permissions:\n      contents: read",
      "    if: false\n    continue-on-error: true\n    permissions:\n      contents: write",
    )
    .replace(
      "      - run: npm test",
      "      - run: npm test\n  other:\n    runs-on: ubuntu-latest\n    steps: []",
    );
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => invalid,
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("one validation job") });
});

test("handles a workflow with no jobs map or runner label", async () => {
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => "name: Validation\non: {}",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("validation job with steps") });
  const noRunner = validWorkflow.replace("    runs-on: ubuntu-latest\n", "");
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => noRunner,
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("must run on Ubuntu") });
});

test("rejects malformed workflow file inventories", async () => {
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => "jobs: {}",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("must enable push") });
});
