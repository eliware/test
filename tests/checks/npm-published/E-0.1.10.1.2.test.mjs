import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.2.mjs";

const workflow = `jobs:
  validate:
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v7
      - run: npm -g install npm@latest
      - run: npm ci
      - run: npm test
  publish:
    needs: validate
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 26
          registry-url: https://registry.npmjs.org
          package-manager-cache: false
      - run: npm -g install npm@latest
      - run: npm ci
      - run: node verify-release-tag.mjs
      - run: npm publish --provenance
`;

function inventory(source = workflow, files = [".github/workflows/publish.yaml"]) {
  return { files: async () => files, readText: async () => source };
}

test("accepts the required npm publisher setup and command", async () => {
  await expect(run({ repositoryInventory: inventory() })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("accepts Node.js 26 as a quoted setup-node value", async () => {
  const source = workflow.replace("node-version: 26", 'node-version: "26"');
  await expect(run({ repositoryInventory: inventory(source) })).resolves.toMatchObject({
    status: "pass",
  });
});

test.each([
  [
    workflow.replace(
      "      - uses: actions/setup-node@v7\n        with:",
      "      - uses: actions/setup-node@v6\n        with:",
    ),
    "setup-node v7",
  ],
  [
    workflow.replace(
      "      - uses: actions/setup-node@v7\n        with:\n          node-version: 26\n          registry-url: https://registry.npmjs.org\n          package-manager-cache: false",
      "      - uses: actions/setup-node@v7",
    ),
    "setup-node v7",
  ],
  [workflow.replace("node-version: 26", "node-version: 20"), "setup-node v7"],
  [workflow.replace("https://registry.npmjs.org", "https://registry.example"), "setup-node v7"],
  [
    workflow.replace("package-manager-cache: false", "package-manager-cache: true"),
    "setup-node v7",
  ],
  [
    workflow.replace(
      "package-manager-cache: false",
      "package-manager-cache: false\n          extra: true",
    ),
    "setup-node v7",
  ],
  [
    workflow.replace(
      "      - run: npm -g install npm@latest\n      - run: npm ci\n      - run: node verify-release-tag.mjs",
      "      - run: npm ci\n      - run: npm -g install npm@latest\n      - run: node verify-release-tag.mjs",
    ),
    "install npm latest",
  ],
  [
    workflow.replace("npm publish --provenance", "npm publish"),
    "standalone npm publish --provenance",
  ],
  [
    workflow.replace(
      "- run: npm publish --provenance",
      "- if: github.ref\n        run: npm publish --provenance",
    ),
    "standalone npm publish --provenance",
  ],
  [
    workflow.replace(
      "- run: npm publish --provenance",
      "- run: npm publish --provenance\n      - run: npm publish --provenance",
    ),
    "standalone npm publish --provenance",
  ],
  [
    workflow.replace("  publish:\n", "  publish:\n    env:\n      NODE_AUTH_TOKEN: value\n"),
    "must not define NODE_AUTH_TOKEN",
  ],
])("rejects an invalid publisher workflow", async (source, message) => {
  await expect(run({ repositoryInventory: inventory(source) })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining(message),
  });
});

test("rejects missing, malformed, and unreadable publisher workflows", async () => {
  await expect(run({ repositoryInventory: inventory(workflow, []) })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("is required"),
  });
  await expect(run({ repositoryInventory: inventory("jobs: [") })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("one valid YAML document"),
  });
  await expect(run()).resolves.toMatchObject({ status: "fail" });
  await expect(
    run({
      repositoryInventory: {
        files: async () => [".github/workflows/publish.yaml"],
        readText: async () => {
          throw new Error("denied");
        },
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("could not be inspected: denied") });
});
