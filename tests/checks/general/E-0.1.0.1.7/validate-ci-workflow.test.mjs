import { expect, test } from "@jest/globals";
import { validateCiWorkflow } from "../../../../src/checks/general/E-0.1.0.1.7/validate-ci-workflow.mjs";

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
      - uses: actions/checkout@v6
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

test("allows a publish workflow for publication profiles", async () => {
  await expect(
    validateCiWorkflow(
      {
        files: async () => [".github/workflows/ci.yaml", ".github/workflows/publish.yaml"],
        readText: async () => workflow,
      },
      { eliware: { apply: ["ghcr-published"] } },
    ),
  ).resolves.toEqual([]);
});

test("reports unreadable workflow inventories", async () => {
  await expect(
    validateCiWorkflow({
      files: async () => {
        throw new Error("offline");
      },
      readText: async () => "",
    }),
  ).resolves.toEqual(["GitHub workflow files could not be inspected: offline"]);
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

test.each([
  workflow.replace(
    "permissions:\n  contents: read",
    "permissions:\n  contents: read\ndefaults:\n  run:\n    shell: bash",
  ),
  workflow.replace(
    "    steps:",
    "    defaults:\n      run:\n        working-directory: tools\n    steps:",
  ),
])("rejects inherited shell and working-directory overrides", async (source) => {
  await expect(
    validateCiWorkflow(
      { files: async () => [".github/workflows/ci.yaml"], readText: async () => source },
      { eliware: { apply: ["general"] } },
    ),
  ).resolves.toContain("ci.yaml must not set inherited shell or working-directory overrides.");
});

test.each([
  workflow.replace("name: Validation", "name: Validation\nextra: true"),
  workflow.replace(
    "    runs-on: ubuntu-latest",
    "    runs-on: ubuntu-latest\n    timeout-minutes: 1",
  ),
  workflow.replace(
    "          node-version: 26",
    "          node-version: 26\n          check-latest: true",
  ),
])("rejects unsupported workflow, job, and action settings", async (source) => {
  const errors = await validateCiWorkflow(
    { files: async () => [".github/workflows/ci.yaml"], readText: async () => source },
    { eliware: { apply: ["general"] } },
  );
  expect(errors.join(" ")).toMatch(/unsupported keys|approved keys and inputs|setup-node may use/u);
});

test.each([
  workflow.replace("name: Validation", "name: Validation\nenv:\n  NPM_CONFIG_IGNORE_SCRIPTS: true"),
  workflow.replace(
    "    runs-on: ubuntu-latest",
    "    runs-on: ubuntu-latest\n    env:\n      CI: false",
  ),
  workflow.replace("branches: [main]", "branches: [main]\n    paths: ['**.md']"),
])("rejects inherited environment values and event path filters", async (source) => {
  const errors = await validateCiWorkflow(
    { files: async () => [".github/workflows/ci.yaml"], readText: async () => source },
    { eliware: { apply: ["general"] } },
  );
  expect(errors.join(" ")).toMatch(/environment values|define only the main branch/u);
});
