import { expect, jest, test } from "@jest/globals";
import { runbookSchemaVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";
import { readRunbookSchema } from "../../../../../src/checks/workspace/E-0.1.2.1.0/read-runbook-schema.mjs";
import { validateRunbookDocuments } from "../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/document-checks.mjs";

const schema = await readRunbookSchema();
const document = `schema-version: ${runbookSchemaVersion}\ntitle: Deploy\npurpose: Deploy the service\nowner: DevOps\nboundaries: Do not change production data\nprerequisites: []\nsteps:\n  - Run npm test`;

test("reads and validates each runbook document", async () => {
  const readText = jest.fn(async () => document);

  await expect(
    validateRunbookDocuments(
      ["runbooks/deploy.yaml"],
      { readText },
      {
        readSchema: async () => schema,
      },
    ),
  ).resolves.toEqual([]);
  expect(readText).toHaveBeenCalledWith("runbooks/deploy.yaml");
});

test("loads the bundled schema when no dependency object is supplied", async () => {
  await expect(
    validateRunbookDocuments(["runbooks/deploy.yaml"], { readText: async () => document }),
  ).resolves.toEqual([]);
});

test("reports schema and document read failures", async () => {
  await expect(
    validateRunbookDocuments(
      ["runbooks/deploy.yaml"],
      { readText: async () => document },
      {
        readSchema: async () => {
          throw new Error("schema unavailable");
        },
      },
    ),
  ).resolves.toEqual(["The bundled runbook schema could not be read: schema unavailable"]);
  await expect(
    validateRunbookDocuments(
      ["runbooks/deploy.yaml"],
      {
        readText: async () => {
          throw new Error("denied");
        },
      },
      { readSchema: async () => schema },
    ),
  ).resolves.toEqual(["runbooks/deploy.yaml could not be read: denied"]);
});

test("reports invalid runbook content", async () => {
  await expect(
    validateRunbookDocuments(
      ["runbooks/deploy.yaml"],
      { readText: async () => `schema-version: ${runbookSchemaVersion - 1}` },
      { readSchema: async () => schema },
    ),
  ).resolves.toContain("runbooks/deploy.yaml.title is required.");
});
