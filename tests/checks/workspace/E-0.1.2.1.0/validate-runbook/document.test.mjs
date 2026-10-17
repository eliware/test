import { expect, test } from "@jest/globals";
import { readRunbookSchema } from "../../../../../src/checks/workspace/E-0.1.2.1.0/read-runbook-schema.mjs";
import { validateRunbookDocument } from "../../../../../src/checks/workspace/E-0.1.2.1.0/validate-runbook/document.mjs";
import { runbookSchemaVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";

const schema = await readRunbookSchema();
const valid = `schema-version: ${runbookSchemaVersion}\ntitle: Deploy\npurpose: Deploy the service\nowner: DevOps\nboundaries: Do not change production data\nprerequisites: []\nsteps:\n  - Run npm test`;

test("accepts a valid single-document runbook", () => {
  expect(validateRunbookDocument(valid, "runbooks/deploy.yaml", schema)).toEqual([]);
});

test("reports invalid YAML and multiple YAML documents", () => {
  expect(validateRunbookDocument("steps: [", "bad.yaml", schema)[0]).toContain("invalid YAML");
  expect(validateRunbookDocument(`${valid}\n---\n${valid}`, "multi.yaml", schema)).toEqual([
    "multi.yaml must contain one YAML document.",
  ]);
  expect(validateRunbookDocument({}, "bad-input.yaml", schema)[0]).toContain("invalid YAML");
});

test("validates runbook fields after YAML parsing", () => {
  const invalid = `schema-version: ${runbookSchemaVersion - 1}\ntitle: '   '\npurpose: Deploy\nowner: DevOps\nboundaries: Safe scope\nprerequisites: []\nsteps: []\nextra: true`;
  expect(validateRunbookDocument(invalid, "invalid.yaml", schema)).toEqual(
    expect.arrayContaining([
      "invalid.yaml.schema-version must equal the required value.",
      "invalid.yaml.title must contain a non-space character.",
      "invalid.yaml.steps must contain at least one step.",
      "invalid.yaml.extra is not allowed.",
    ]),
  );
});

test("reports schema errors at the document boundary", () => {
  expect(validateRunbookDocument(valid, "bad-schema.yaml", { type: "number" })).toEqual([
    "bad-schema.yaml could not be validated: Unsupported schema type: number.",
  ]);
});
