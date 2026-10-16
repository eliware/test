import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../src/checks/npm-published/E-0.1.10.1.0.mjs";

const packageJson = {
  name: "@eliware/fixture",
  repository: { url: "https://github.com/eliware/fixture" },
};
const badge =
  "## @eliware/fixture " +
  "[![npm](https://img.shields.io/npm/v/@eliware/fixture)](https://www.npmjs.com/package/@eliware/fixture) " +
  "[![License](https://img.shields.io/github/license/eliware/fixture)](https://github.com/eliware/fixture/blob/main/LICENSE) " +
  "[![CI](https://github.com/eliware/fixture/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/ci.yaml)";
const repositoryInventory = {
  readText: async (path) => {
    if (path === "README.md") return `# fixture\n\n${badge}\n\n## Features\n`;
    if (path === "AGENTS.md") return "## npm publication\n";
    return "";
  },
};

test("requires canonical npm publication documentation", async () => {
  await expect(run({ packageJson, repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports missing documentation and invalid npm badges", async () => {
  await expect(run()).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining("Repository documents could not be inspected"),
  });
  await expect(
    run({ packageJson, repositoryInventory: { readText: async () => "invalid" } }),
  ).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("canonical npm"),
  });
});
