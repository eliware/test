import { expect, test } from "@jest/globals";
import { validateKnitConfiguration } from "../../../../src/checks/general/E-0.1.0.1.6/validate-knit-configuration.mjs";

const validCommands = ["git pull --ff-only origin main", "npm ci", "npm test"];
const deploy = (commands = validCommands) =>
  `version: 1\non:\n  push:\n    deployments:\n      - timeoutMs: 300000\n        commands:\n${commands.map((item) => `          - ${item}`).join("\n")}\n`;
const inventory = (text, files = [".knit/deploy.yaml"]) => ({
  files: async () => files,
  readText: async () => text,
});

test("validates Knit deployment and command configuration", async () => {
  await expect(validateKnitConfiguration(inventory(deploy()))).resolves.toEqual([]);
});

test("requires the canonical timeout for push and tag deployments", async () => {
  const tag = `  tags:\n    v*:\n      deployments:\n        - timeoutMs: 1\n          commands:\n${validCommands.map((item) => `            - ${item}`).join("\n")}\n`;
  await expect(validateKnitConfiguration(inventory(`${deploy()}${tag}`))).resolves.toContain(
    ".knit/deploy.yaml tag v* deployment 1 must set timeoutMs to 300000.",
  );
  await expect(
    validateKnitConfiguration(inventory(deploy().replace("timeoutMs: 300000", "timeoutMs: 1"))),
  ).resolves.toContain(".knit/deploy.yaml deployment 1 must set timeoutMs to 300000.");
});

test("accepts repository-specific deployment paths and quoted on keys", async () => {
  const source = deploy()
    .replace("on:", "'on':")
    .replace("        timeoutMs", `      cwd: /${"srv"}/app\n        timeoutMs`);
  await expect(validateKnitConfiguration(inventory(source))).resolves.toEqual([]);
});

test("reports missing inventory, missing files, and unreadable files", async () => {
  await expect(validateKnitConfiguration()).resolves.toEqual([
    "Knit configuration could not be inspected.",
  ]);
  await expect(validateKnitConfiguration(inventory("", [".knit/other.yaml"]))).resolves.toEqual([
    ".knit/deploy.yaml must be the only YAML file under .knit/.",
  ]);
  await expect(
    validateKnitConfiguration({
      files: async () => {
        throw new Error("inventory unavailable");
      },
      readText: async () => "",
    }),
  ).resolves.toEqual(["Knit configuration could not be inspected: inventory unavailable"]);
});

test("reports invalid YAML, multiple documents, missing deployments, and commands", async () => {
  await expect(validateKnitConfiguration(inventory("invalid: ["))).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("could not be parsed")]),
  );
  await expect(
    validateKnitConfiguration(inventory(`${deploy()}---\nversion: 1`)),
  ).resolves.toContain(".knit/deploy.yaml must contain exactly one document.");
  await expect(
    validateKnitConfiguration(inventory("version: 1\non:\n  push:\n    deployments: {}")),
  ).resolves.toContain(".knit/deploy.yaml must define push deployments.");
  await expect(
    validateKnitConfiguration(inventory("version: 1\non:\n  push:\n    deployments: []")),
  ).resolves.toContain(".knit/deploy.yaml must define commands fields.");
});
