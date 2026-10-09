import { expect, test } from "@jest/globals";
import { validateNpmPublishWorkflow } from "../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow.mjs";

const source = `jobs:
  publish:
    steps:
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm publish --provenance
`;

const inventory = (text = source) => ({
  files: async () => [".github/workflows/publish.yaml"],
  readText: async () => text,
});

test("validates the npm publisher workflow", async () => {
  await expect(validateNpmPublishWorkflow(inventory())).resolves.toEqual([]);
});

test("rejects publish jobs that do not define workflow steps", async () => {
  await expect(validateNpmPublishWorkflow(inventory("jobs: { publish: {} }"))).resolves.toContain(
    "publish.yaml publish job must define steps.",
  );
});
