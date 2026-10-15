import { expect, test } from "@jest/globals";
import { validateNpmPublishWorkflow } from "../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow.mjs";
import { packageVersion } from "../../../helpers/project-version.mjs";

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
  await expect(
    validateNpmPublishWorkflow(inventory(), { version: packageVersion }),
  ).resolves.toEqual([]);
});

test.each([
  source,
  source.replace('tags: ["v[0-9]*.[0-9]*.[0-9]*"]', 'tags:\n      - "v[0-9]*.[0-9]*.[0-9]*"'),
])("accepts equivalent inline and block release tag lists", async (workflow) => {
  await expect(
    validateNpmPublishWorkflow(inventory(workflow), { version: packageVersion }),
  ).resolves.toEqual([]);
});

test("requires a canonical package-version tag guard", async () => {
  const withoutGuard = source.replace(/^      - run: node -e .*\r?\n/mu, "");
  await expect(
    validateNpmPublishWorkflow(inventory(withoutGuard), { version: packageVersion }),
  ).resolves.toContain(
    "npm publisher must guard publication with the canonical package version tag.",
  );
  await expect(
    validateNpmPublishWorkflow(inventory(), { version: `${packageVersion}-beta` }),
  ).resolves.toContain(
    "npm publisher must guard publication with the canonical package version tag.",
  );
});

test("rejects a publish step before the tag guard even when a later publish step is valid", async () => {
  const withEarlyPublish = source.replace(
    "      - run: node -e",
    "      - run: npm publish --provenance\n      - run: node -e",
  );
  const errors = await validateNpmPublishWorkflow(inventory(withEarlyPublish), {
    version: packageVersion,
  });
  expect(errors).toContain(
    "npm publisher must guard publication with the canonical package version tag.",
  );
  expect(errors).toContain(
    "npm publisher must have one unconditional standalone npm publish --provenance step.",
  );
});

test("rejects publish jobs that do not define workflow steps", async () => {
  await expect(
    validateNpmPublishWorkflow(inventory("jobs: { publish: {} }"), { version: packageVersion }),
  ).resolves.toContain("publish.yaml publish job must define steps.");
});

test("reports missing workflow files, invalid YAML, and inventory failures", async () => {
  await expect(
    validateNpmPublishWorkflow({ files: async () => [], readText: async () => "" }, {}),
  ).resolves.toContain(".github/workflows/publish.yaml is required.");
  await expect(
    validateNpmPublishWorkflow(inventory("jobs: ["), { version: packageVersion }),
  ).resolves.toContain(".github/workflows/publish.yaml must contain one valid YAML document.");
  await expect(
    validateNpmPublishWorkflow(inventory(`${source}\n---\njobs: {}`), { version: packageVersion }),
  ).resolves.toContain(".github/workflows/publish.yaml must contain one valid YAML document.");
  await expect(
    validateNpmPublishWorkflow({
      files: async () => {
        return [".github/workflows/publish.yaml"];
      },
      readText: async () => {
        throw new Error("read denied");
      },
    }),
  ).resolves.toContain(".github/workflows/publish.yaml could not be inspected: read denied");
  await expect(validateNpmPublishWorkflow()).resolves.toEqual([
    "publish.yaml could not be inspected.",
  ]);
});

test.each([
  ["wrong setup version", source.replace("actions/setup-node@v7", "actions/setup-node@v6")],
  ["wrong registry", source.replace("https://registry.npmjs.org", "https://example.test")],
  [
    "missing setup inputs",
    source.replace(
      "        with:\n          node-version: 26\n          registry-url: https://registry.npmjs.org\n          package-manager-cache: false\n",
      "",
    ),
  ],
  [
    "extra setup input",
    source.replace(
      "package-manager-cache: false",
      "package-manager-cache: false\n          cache: npm",
    ),
  ],
  [
    "conditional setup",
    source.replace(
      "      - uses: actions/setup-node@v7",
      "      - uses: actions/setup-node@v7\n        if: always()",
    ),
  ],
])("rejects %s", async (_name, workflow) => {
  await expect(
    validateNpmPublishWorkflow(inventory(workflow), { version: packageVersion }),
  ).resolves.toContain(
    "npm publish job must use setup-node v7 with Node.js 26 and the npm registry.",
  );
});

test.each([
  ["missing npm update", source.replace("      - run: npm -g install npm@latest\n", "")],
  [
    "npm update after install",
    source.replace(
      "      - run: npm -g install npm@latest\n      - run: npm ci",
      "      - run: npm ci\n      - run: npm -g install npm@latest",
    ),
  ],
  [
    "conditional npm update",
    source.replace(
      "      - run: npm -g install npm@latest",
      "      - run: npm -g install npm@latest\n        if: always()",
    ),
  ],
  [
    "conditional npm ci",
    source.replace("      - run: npm ci", "      - run: npm ci\n        continue-on-error: true"),
  ],
])("rejects invalid install order: %s", async (_name, workflow) => {
  await expect(
    validateNpmPublishWorkflow(inventory(workflow), { version: packageVersion }),
  ).resolves.toContain("npm publisher must install npm latest before npm ci after setup-node.");
});

test.each([
  ["missing publish", source.replace("      - run: npm publish --provenance\n", "")],
  ["wrong publish command", source.replace("npm publish --provenance", "npm publish")],
  [
    "conditional publish",
    source.replace(
      "      - run: npm publish --provenance",
      "      - run: npm publish --provenance\n        if: always()",
    ),
  ],
  [
    "extra publish field",
    source.replace(
      "      - run: npm publish --provenance",
      "      - run: npm publish --provenance\n        env: { CI: true }",
    ),
  ],
])("rejects invalid publish step: %s", async (_name, workflow) => {
  await expect(
    validateNpmPublishWorkflow(inventory(workflow), { version: packageVersion }),
  ).resolves.toContain(
    "npm publisher must have one unconditional standalone npm publish --provenance step.",
  );
});
