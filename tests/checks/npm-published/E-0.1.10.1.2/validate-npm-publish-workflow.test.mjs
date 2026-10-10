import { expect, test } from "@jest/globals";
import { validateNpmPublishWorkflow } from "../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow.mjs";

const source = `jobs:
  publish:
    steps:
      - uses: actions/checkout@v6
      - run: node -e "const version=require('./package.json').version;if(!/^(0|[1-9][0-9]*)[.](0|[1-9][0-9]*)[.](0|[1-9][0-9]*)$/.test(version)||process.env.GITHUB_REF_NAME!=='v'+version)process.exit(1)"
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm publish --provenance
on:
  push:
    tags: ["v[0-9]*.[0-9]*.[0-9]*"]
`;

const inventory = (text = source) => ({
  files: async () => [".github/workflows/publish.yaml"],
  readText: async () => text,
});

test("validates the npm publisher workflow", async () => {
  await expect(validateNpmPublishWorkflow(inventory(), { version: "12.0.0" })).resolves.toEqual([]);
});

test("requires a canonical package-version tag guard", async () => {
  const withoutGuard = source.replace(/^      - run: node -e .*\r?\n/mu, "");
  await expect(
    validateNpmPublishWorkflow(inventory(withoutGuard), { version: "12.0.0" }),
  ).resolves.toContain(
    "npm publisher must guard publication with the canonical package version tag.",
  );
  await expect(
    validateNpmPublishWorkflow(inventory(), { version: "12.0.0-beta" }),
  ).resolves.toContain(
    "npm publisher must guard publication with the canonical package version tag.",
  );
});

test("rejects publish jobs that do not define workflow steps", async () => {
  await expect(
    validateNpmPublishWorkflow(inventory("jobs: { publish: {} }"), { version: "12.0.0" }),
  ).resolves.toContain("publish.yaml publish job must define steps.");
});
