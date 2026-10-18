import { expect, test } from "@jest/globals";
import { runbookSchemaVersion } from "../../../test-fixtures/helpers/project-version.mjs";
import { readRunbookSchema } from "../../../src/checks/workspace/E-0.1.2.1.0/read-runbook-schema.mjs";
import { ruleId, run } from "../../../src/checks/workspace/E-0.1.2.1.0.mjs";

const schema = await readRunbookSchema();
const index = "# Runbooks\n\n- [Deploy](deploy.yaml)";
const document = `schema-version: ${runbookSchemaVersion}\ntitle: Deploy\npurpose: Deploy the service\nowner: DevOps\nboundaries: Do not change production data\nprerequisites: []\nsteps:\n  - Run npm test`;

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

test("validates the runbook index and documents through the workspace rule", async () => {
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

test("uses the bundled schema when no schema reader is injected", async () => {
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

test("accepts an index when no runbook documents exist", async () => {
  await expect(
    run({ repositoryInventory: inventory(["runbooks/README.md"], async () => "# Runbooks") }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("returns a failed rule result when runbook validation finds an error", async () => {
  await expect(
    run({ repositoryInventory: inventory(["runbooks/README.md"], async () => "Overview") }),
  ).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: expect.stringContaining(
      "runbooks/README.md must contain only headings and runbook links.",
    ),
  });
});

test("requires an inventory and reports inventory errors", async () => {
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
