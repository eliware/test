import { expect, test } from "@jest/globals";
import { readRunbookSchema } from "../../../src/checks/workspace/E-0.1.2.1.0/read-runbook-schema.mjs";
import { ruleId, run } from "../../../src/checks/workspace/E-0.1.2.1.0.mjs";

const schema = await readRunbookSchema();
const index = "# Runbooks\n\n- [Deploy](deploy.yaml)";
const document = "schema-version: 12\ntitle: Deploy\nsteps:\n  - Run npm test";

function inventory(files, readText = async () => "") {
  return {
    files: async () => files,
    readText: async (path) => {
      if (path === "AGENTS.md") return "## Workspace";
      if (path === "README.md") return "## Runbooks\n## Communication\n## Recovery";
      return readText(path);
    },
  };
}

test("validates the workspace runbook index and schema", async () => {
  const repositoryInventory = inventory(
    ["runbooks/README.md", "runbooks/deploy.yaml"],
    async (path) => (path.endsWith("README.md") ? index : document),
  );
  await expect(run({ repositoryInventory }, { readSchema: async () => schema })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("loads the bundled schema when no schema dependency is injected", async () => {
  const repositoryInventory = inventory(
    ["runbooks/README.md", "runbooks/deploy.yaml"],
    async (path) => (path.endsWith("README.md") ? index : document),
  );
  await expect(run({ repositoryInventory })).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("requires an inventory and reports inventory read failures", async () => {
  await expect(run()).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("inventory is required"),
  });
  await expect(
    run({
      repositoryInventory: {
        files: async () => {
          throw new Error("denied");
        },
        readText: async () => "",
      },
    }),
  ).resolves.toMatchObject({ message: expect.stringContaining("denied") });
});

test("requires an index and rejects non-YAML runbook files", async () => {
  await expect(
    run({ repositoryInventory: inventory(["runbooks/plan.json"]) }),
  ).resolves.toMatchObject({ message: expect.stringContaining("runbooks/README.md is required") });
  await expect(
    run({
      repositoryInventory: inventory(
        ["runbooks/README.md", "runbooks/plan.yml"],
        async () => "# Runbooks",
      ),
    }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("plan.yml must use the .yaml extension"),
  });
});

test("reports index read failures and schema read failures", async () => {
  await expect(
    run({
      repositoryInventory: inventory(["runbooks/README.md"], async () => {
        throw new Error("blocked");
      }),
    }),
  ).resolves.toMatchObject({
    message: expect.stringContaining("README.md could not be read: blocked"),
  });
  await expect(
    run(
      {
        repositoryInventory: inventory(
          ["runbooks/README.md", "runbooks/deploy.yaml"],
          async (path) => (path.endsWith("README.md") ? index : document),
        ),
      },
      {
        readSchema: async () => {
          throw new Error("schema unavailable");
        },
      },
    ),
  ).resolves.toMatchObject({ message: expect.stringContaining("schema unavailable") });
});

test("reports runbook read errors and invalid runbook content", async () => {
  await expect(
    run(
      {
        repositoryInventory: inventory(
          ["runbooks/README.md", "runbooks/deploy.yaml"],
          async (path) =>
            path.endsWith("README.md") ? index : Promise.reject(new Error("denied")),
        ),
      },
      { readSchema: async () => schema },
    ),
  ).resolves.toMatchObject({
    message: expect.stringContaining("deploy.yaml could not be read: denied"),
  });
  await expect(
    run(
      {
        repositoryInventory: inventory(
          ["runbooks/README.md", "runbooks/deploy.yaml"],
          async (path) => (path.endsWith("README.md") ? index : "schema-version: 11"),
        ),
      },
      { readSchema: async () => schema },
    ),
  ).resolves.toMatchObject({ message: expect.stringContaining("deploy.yaml.title is required") });
});
