import { expect, test } from "@jest/globals";
import { validateCiWorkflow } from "../../../../../src/checks/shared/E-0.1.0.1.7/validate/ci-workflow.mjs";
const workflow = `name: Validation
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
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          cache: npm
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm test`;

test("accepts the required workflow file set for a general profile", async () => {
  await expect(
    validateCiWorkflow(
      {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => workflow,
      },
      { eliware: { apply: ["general"] } },
    ),
  ).resolves.toEqual([]);
});

test("rejects inherited workflow and job settings", async () => {
  const configured = workflow
    .replace("permissions:\n  contents: read", "env:\n  MODE: test\npermissions:\n  contents: read")
    .replace(
      "    runs-on: ubuntu-latest",
      "    env:\n      MODE: test\n    defaults:\n      run:\n        shell: bash\n    runs-on: ubuntu-latest",
    )
    .replace(
      "concurrency:\n  group:",
      "defaults:\n  run:\n    working-directory: src\nconcurrency:\n  group:",
    );
  await expect(validateCiWorkflow({ readText: async () => configured })).resolves.toEqual(
    expect.arrayContaining([
      "ci.yaml must not define inherited workflow environment values.",
      "ci.yaml validation job must not define inherited environment values.",
      "ci.yaml must not set inherited shell or working-directory overrides.",
    ]),
  );
});

test("requires readable validation workflow content", async () => {
  await expect(
    validateCiWorkflow({ files: async () => [".github/workflows/ci.yaml"] }),
  ).resolves.toEqual(["GitHub workflow files could not be inspected."]);
  await expect(
    validateCiWorkflow({ readText: async () => Promise.reject(new Error("offline")) }),
  ).resolves.toEqual(["GitHub workflow files could not be inspected: offline"]);
});

test("reports invalid YAML and multiple YAML documents", async () => {
  await expect(validateCiWorkflow({ readText: async () => "jobs: [" })).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("could not be parsed")]),
  );
  await expect(
    validateCiWorkflow({ readText: async () => `${workflow}\n---\nname: Extra` }),
  ).resolves.toContain(".github/workflows/ci.yaml must contain exactly one document.");
});

test("accepts the quoted on key", async () => {
  await expect(
    validateCiWorkflow({ readText: async () => workflow.replace("on:", "'on':") }),
  ).resolves.toEqual([]);
});

test("reports missing event data", async () => {
  await expect(
    validateCiWorkflow({
      readText: async () => workflow.replace(/on:[\s\S]*?concurrency:/u, "on: null\nconcurrency:"),
    }),
  ).resolves.toContain("ci.yaml must enable push for main.");
});

test("reports a workflow without a jobs map", async () => {
  await expect(
    validateCiWorkflow(
      {
        files: async () => [".github/workflows/ci.yaml"],
        readText: async () => "name: Validation\non: {}",
      },
      { eliware: { apply: ["general"] } },
    ),
  ).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("validation job with steps")]),
  );
});

test("rejects unsupported workflow events", async () => {
  const source = workflow.replace("on:\n", "on:\n  schedule: []\n");
  await expect(
    validateCiWorkflow(
      { files: async () => [".github/workflows/ci.yaml"], readText: async () => source },
      { eliware: { apply: ["general"] } },
    ),
  ).resolves.toContain("ci.yaml must define only push and pull_request events.");
});
