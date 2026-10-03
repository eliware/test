import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { stringify } from "yaml";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.10/E-0.1.10.1.mjs";

const requiredCommands = ["git pull --ff-only origin main", "npm ci", "npm test"];

function configuration(commandLists) {
  return stringify({
    version: 1,
    on: {
      push: {
        deployments: commandLists.map((commands) => ({
          target: "dev",
          cwd: "/repo",
          commands,
        })),
      },
    },
  });
}

async function withConfiguration(contents, callback) {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-deploy-"));
  try {
    await mkdir(join(root, ".knit"));
    if (contents !== undefined) await writeFile(join(root, ".knit", "deploy.yaml"), contents);
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("validates the repository Knit deployment command list", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-0.1.10.1",
    status: "pass",
    message: "",
  });
});

test("allows repository-specific commands after npm test", async () => {
  const contents = configuration([
    [
      ...requiredCommands,
      "node .knit/check-gitops-state.mjs",
      "custom command --with-shell | syntax",
    ],
  ]);
  await withConfiguration(contents, async (root) => {
    await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  });
});

test.each(["npm publish", "docker push ghcr.io/eliware/example:latest"])(
  "rejects a prohibited publishing command after npm test: %s",
  async (command) => {
    await withConfiguration(configuration([[...requiredCommands, command]]), async (root) => {
      await expect(run({ root })).resolves.toMatchObject({
        status: "fail",
        message: expect.stringContaining("publishing command"),
      });
    });
  },
);

test("requires the command sequence in every deployment list", async () => {
  const contents = configuration([requiredCommands, ["npm ci", ...requiredCommands.slice(1)]]);
  await withConfiguration(contents, async (root) => {
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("commands list 2 command 1"),
    });
  });
});

test("discovers and validates command arrays nested in multiple deployment levels", async () => {
  const commands = {
    version: 1,
    on: {
      push: {
        deployments: [
          { commands: requiredCommands },
          { nested: { deployments: [{ commands: requiredCommands }] } },
        ],
      },
    },
  };
  await withConfiguration(stringify(commands), async (root) => {
    await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  });
});

test.each([
  ["reordered", ["npm ci", ...requiredCommands.slice(0, 1), ...requiredCommands.slice(2)]],
  ["incomplete", requiredCommands.slice(0, 2)],
  ["non-string", ["git pull --ff-only origin main", { command: "npm ci" }, "npm test"]],
])("rejects %s required commands", async (_name, commands) => {
  await withConfiguration(configuration([commands]), async (root) => {
    await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  });
});

test("reports missing, malformed, and command-free deployment configuration", async () => {
  await withConfiguration(undefined, async (root) => {
    await expect(run({ root })).resolves.toEqual({
      ruleId: "E-0.1.10.1",
      status: "fail",
      message: ".knit/deploy.yaml is required for Knit validation.",
    });
  });
  await withConfiguration("on: [invalid\n", async (root) => {
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("could not be parsed"),
    });
  });
  await withConfiguration(
    "commands: [git pull --ff-only origin main, npm ci, npm test]\n---\nversion: 2\n",
    async (root) => {
      await expect(run({ root })).resolves.toMatchObject({
        status: "fail",
        message: expect.stringContaining("exactly one YAML document"),
      });
    },
  );
  await withConfiguration("version: 1\n", async (root) => {
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("must define Knit validation commands"),
    });
  });
});

test("rejects a commands field that is not an array", async () => {
  await withConfiguration("commands: npm test\n", async (root) => {
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("commands list 1 must be an array"),
    });
  });
});

test("rejects a nested commands value instead of skipping its malformed parent", async () => {
  const nestedCommands = { nested: requiredCommands };
  await withConfiguration(stringify({ commands: nestedCommands }), async (root) => {
    await expect(run({ root })).resolves.toMatchObject({
      status: "fail",
      message: expect.stringContaining("commands list 1 must be an array"),
    });
  });
});

test("reads the parsed deployment YAML from the shared inventory", async () => {
  const parsedConfig = {
    on: { push: { deployments: [{ commands: requiredCommands }] } },
  };
  const readParsed = jest.fn(async (_path, _key, parseYaml) => {
    expect(parseYaml).toEqual(expect.any(Function));
    return parsedConfig;
  });
  await expect(run({ root: "/repo", repositoryInventory: { readParsed } })).resolves.toMatchObject({
    status: "pass",
  });
  expect(readParsed).toHaveBeenCalledWith(
    join("/repo", ".knit", "deploy.yaml"),
    "yaml-document",
    expect.any(Function),
  );
});
