import { expect, test } from "@jest/globals";
import { join } from "node:path";
import { readConsumerSpecificationFiles } from "../../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/consumer/files.mjs";

const root = "C:/repo";
const specs = join(root, "specs");
const nested = join(specs, "nested");
const record = (name) => ({ name, isDirectory: () => false, isFile: () => true });
const folder = (name) => ({ name, isDirectory: () => true, isFile: () => false });
const directiveDocument =
  "version: '15.0'\ndescription: Rules\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n";

test("reads directive documents from nested YAML files", async () => {
  const result = await readConsumerSpecificationFiles(root, {
    readdir: async (path) => {
      if (path === specs)
        return [record("directives.yaml"), record("schema.json"), folder("nested")];
      if (path === nested) return [record("extra.yml")];
      return [];
    },
    read: async () => directiveDocument,
  });
  expect(result.errors).toEqual([]);
  expect(result.directivePathExists).toBe(true);
  expect(result.directivePathParsed).toBe(true);
  expect(result.directivePathHasDirectives).toBe(true);
  expect(result.documents.map(({ path }) => path)).toEqual([
    "specs/directives.yaml document 1",
    "specs/nested/extra.yml document 1",
  ]);
});

test("reports specification discovery failure", async () => {
  await expect(
    readConsumerSpecificationFiles(root, {
      readdir: async () => {
        throw new Error("blocked");
      },
    }),
  ).resolves.toEqual({ error: "Consumer specification discovery failed: blocked" });
});

test("uses the default file reader without reading when no YAML files exist", async () => {
  await expect(
    readConsumerSpecificationFiles(root, { readdir: async () => [] }),
  ).resolves.toMatchObject({ errors: [], documents: [], directivePathExists: false });
});

test("records unreadable and malformed YAML files", async () => {
  const result = await readConsumerSpecificationFiles(root, {
    readdir: async () => [record("directives.yaml"), record("bad.yaml")],
    read: async (path) => {
      if (path.endsWith("directives.yaml")) throw new Error("read denied");
      if (path.endsWith("bad.yaml")) return "directives: [";
      return {};
    },
  });
  expect(result.errors).toContain("specs/directives.yaml could not be read: read denied");
  expect(result.errors[0]).toContain("specs/bad.yaml is invalid YAML:");
});

test("records parser exceptions and empty root directive documents", async () => {
  const invalidSource = await readConsumerSpecificationFiles(root, {
    readdir: async () => [record("directives.yaml")],
    read: async () => ({}),
  });
  expect(invalidSource.errors).toEqual([
    "specs/directives.yaml is invalid YAML: source is not a string",
  ]);
  const emptyDirectives = await readConsumerSpecificationFiles(root, {
    readdir: async () => [record("directives.yaml")],
    read: async () => "version: '15.0'\ndescription: No rules\n",
  });
  expect(emptyDirectives.directivePathParsed).toBe(true);
  expect(emptyDirectives.directivePathHasDirectives).toBe(false);
});
