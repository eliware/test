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
