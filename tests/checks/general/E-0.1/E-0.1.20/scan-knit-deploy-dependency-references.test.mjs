import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanKnitDeployDependencyReferences } from "../../../../../src/checks/general/E-0.1/E-0.1.20/scan-knit-deploy-dependency-references.mjs";

const declared = ["@eliware/vyops"];
const binaries = new Map([["vyops", "@eliware/vyops"]]);

test("counts direct binaries invoked by Knit deployment commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-dependency-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(
      join(root, ".knit", "deploy.yaml"),
      "on:\n  push:\n    deployments:\n      - commands:\n          - git pull --ff-only origin main\n          - npm ci\n          - npm test\n          - vyops preflight config.boot\n",
    );
    const referenced = new Set();
    await scanKnitDeployDependencyReferences(
      root,
      [".knit/deploy.yaml"],
      declared,
      referenced,
      binaries,
    );
    expect([...referenced]).toEqual(["@eliware/vyops"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("counts local package binary paths invoked by Knit deployment commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-dependency-local-path-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(
      join(root, ".knit", "deploy.yaml"),
      "on:\n  push:\n    deployments:\n      - commands:\n          - npm ci\n          - npm test\n          - node node_modules/.bin/vyops preflight config.boot\n",
    );
    const referenced = new Set();
    await scanKnitDeployDependencyReferences(
      root,
      [".knit/deploy.yaml"],
      declared,
      referenced,
      binaries,
    );
    expect([...referenced]).toEqual(["@eliware/vyops"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses the shared parsed YAML cache", async () => {
  const deployment = { on: { push: { deployments: [{ commands: ["vyops preflight"] }] } } };
  const inventory = { readParsed: jest.fn(async () => deployment) };
  const referenced = new Set();
  await scanKnitDeployDependencyReferences(
    "/repo",
    [".knit/deploy.yaml"],
    declared,
    referenced,
    binaries,
    inventory,
  );
  expect(inventory.readParsed).toHaveBeenCalledWith(
    join("/repo", ".knit", "deploy.yaml"),
    "yaml-document",
    expect.any(Function),
  );
  expect(referenced.has("@eliware/vyops")).toBe(true);
});

test("ignores valid deployment YAML without command lists", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-no-commands-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(
      join(root, ".knit", "deploy.yaml"),
      "version: 1\nmetadata:\n  labels:\n    - dev\n",
    );
    const referenced = new Set();
    await scanKnitDeployDependencyReferences(
      root,
      [".knit/deploy.yaml"],
      declared,
      referenced,
      binaries,
    );
    expect(referenced.size).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores absent, malformed, and non-command Knit configuration", async () => {
  const referenced = new Set();
  await scanKnitDeployDependencyReferences("/missing", [], declared, referenced, binaries);
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-empty-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(join(root, ".knit", "deploy.yaml"), "commands: vyops preflight\n");
    await scanKnitDeployDependencyReferences(
      root,
      [".knit/deploy.yaml"],
      declared,
      referenced,
      binaries,
    );
    await writeFile(join(root, ".knit", "deploy.yaml"), "on: [invalid\n");
    await scanKnitDeployDependencyReferences(
      root,
      [".knit/deploy.yaml"],
      declared,
      referenced,
      binaries,
    );
    expect(referenced.size).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
