import { expect, test } from "@jest/globals";
import { validatePrivateWorkflows } from "../../../../src/checks/private/E-0.1.12.1.0/validate-private-workflows.mjs";

function inventory(files, contents) {
  return {
    files: async () => files,
    readText: async (path) => {
      if (contents instanceof Error) throw contents;
      return contents[path];
    },
  };
}

test("rejects missing inventory readers", async () => {
  await expect(validatePrivateWorkflows()).resolves.toEqual([
    "GitHub workflows could not be inspected for npm publication settings.",
  ]);
});

test("accepts workflows without npm publication settings", async () => {
  await expect(
    validatePrivateWorkflows(
      inventory([".github/workflows/ci.yaml", "other/file.yaml"], {
        ".github/workflows/ci.yaml": "name: CI\njobs: {}\n",
      }),
    ),
  ).resolves.toEqual([]);
});

test("accepts empty workflow objects", async () => {
  const path = ".github/workflows/ci.yaml";
  await expect(
    validatePrivateWorkflows(inventory([path], { [path]: "jobs: null\n" })),
  ).resolves.toEqual([]);
});

test("rejects npm publication commands and token settings in any workflow", async () => {
  const path = ".github/workflows/publish.yaml";
  const yaml = [
    "jobs:",
    "  publish:",
    "    env:",
    "      NODE_AUTH_TOKEN: secret",
    "    steps:",
    "      - run: npm publish --provenance",
    "      - run: echo $NPM_TOKEN",
  ].join("\n");
  await expect(validatePrivateWorkflows(inventory([path], { [path]: yaml }))).resolves.toEqual([
    `${path}.jobs.publish.env.NODE_AUTH_TOKEN must not define npm publication tokens.`,
    `${path}.jobs.publish.steps.0.run must not run an npm publication command.`,
    `${path}.jobs.publish.steps.1.run must not reference npm publication tokens.`,
  ]);
});

test("rejects invalid workflow YAML", async () => {
  const path = ".github/workflows/ci.yml";
  await expect(validatePrivateWorkflows(inventory([path], { [path]: "jobs: [" }))).resolves.toEqual(
    [`${path} must contain one valid YAML document.`],
  );
});

test("reports workflow inventory and read errors", async () => {
  await expect(
    validatePrivateWorkflows({
      files: async () => {
        throw new Error("inventory failure");
      },
      readText: async () => "",
    }),
  ).resolves.toEqual(["GitHub workflows could not be inspected: inventory failure"]);
  const path = ".github/workflows/ci.yaml";
  await expect(
    validatePrivateWorkflows(inventory([path], new Error("read failure"))),
  ).resolves.toEqual([`${path} could not be inspected: read failure`]);
});
