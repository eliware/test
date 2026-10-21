import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readFile = jest.fn();
const readdir = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ readFile, readdir }));

const { validateConsumerSpecifications } =
  await import("../../../../../src/checks/general/E-0.1.0.1.4/validate/consumer-specifications.mjs");

const root = "C:/repo";
const specs = join(root, "specs");
const nested = join(specs, "nested");
const mainDocument =
  "version: '15.0'\ndescription: Rules\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n";
const duplicateDocument =
  "version: '15.0'\ndescription: Duplicate\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n";
const record = (name) => ({ name, isDirectory: () => false, isFile: () => true });
const folder = (name) => ({ name, isDirectory: () => true, isFile: () => false });

function setRootTree() {
  readdir.mockImplementation(async (path) => {
    if (path === specs) return [record("directives.yaml")];
    return [];
  });
  readFile.mockImplementation(async () => mainDocument);
}

beforeEach(() => {
  readFile.mockReset();
  readdir.mockReset();
});

test("parses every YAML file and validates directive documents recursively", async () => {
  readdir.mockImplementation(async (path) => {
    if (path === specs)
      return [record("directives.yaml"), record("custom-schema.yaml"), folder("nested")];
    if (path === nested) return [folder("deep")];
    if (path === join(nested, "deep")) return [record("extra.yml")];
    return [];
  });
  readFile.mockImplementation(async (path) => {
    if (path.endsWith("directives.yaml")) return mainDocument;
    if (path.endsWith("custom-schema.yaml"))
      return "type: object\nproperties: {name: {type: string}}\n";
    if (path.endsWith("extra.yml"))
      return "version: '15.0'\ndescription: Extra\ndirectives:\n  - id: E-0.1\n    dos: [Do]\n    donts: [Do not]\n";
    throw new Error(`Unexpected read: ${path}`);
  });

  await expect(validateConsumerSpecifications(root, "E-0")).resolves.toEqual([]);
  readFile.mockImplementation(async (path) =>
    path.endsWith("custom-schema.yaml") ? "type: [\n" : mainDocument,
  );
  expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
    "custom-schema.yaml is invalid YAML",
  );
});

test("rejects duplicate IDs across directive files", async () => {
  readdir.mockImplementation(async (path) =>
    path === specs ? [record("directives.yaml"), folder("nested")] : [record("extra.yaml")],
  );
  readFile.mockImplementation(async (path) =>
    path.endsWith("directives.yaml") ? mainDocument : duplicateDocument,
  );

  expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
    "Duplicate specification rule ID: E-0.0",
  );
});

test("requires the root directive file and reports invalid YAML", async () => {
  readdir.mockResolvedValue([]);
  expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
    "specs/directives.yaml is required",
  );

  readdir.mockResolvedValue([record("directives.yaml")]);
  readFile.mockResolvedValue("version: '15.0'\ndescription: No rules\n");
  expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
    "specs/directives.yaml must contain a directive document",
  );
  readFile.mockResolvedValue("version: '15.0'\ndescription: Invalid\ndirectives: null\n");
  expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
    "directives must be a nonempty array",
  );
  readFile.mockResolvedValue("directives: [\n");
  expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
    "directives.yaml is invalid YAML",
  );
});

test("reports specification discovery failures", async () => {
  readdir.mockRejectedValue(new Error("blocked"));
  await expect(validateConsumerSpecifications(root, "E-0")).resolves.toEqual([
    "Consumer specification discovery failed: blocked",
  ]);
});

test("requires a valid assigned rule namespace", async () => {
  setRootTree();
  expect((await validateConsumerSpecifications(root, "invalid")).join(" ")).toContain(
    "package.json.eliware.id must define the assigned E-number.",
  );
});

test("reports unreadable and unparseable specification files", async () => {
  readdir.mockResolvedValue([record("directives.yaml")]);
  readFile.mockRejectedValue(new Error("blocked"));

  await expect(validateConsumerSpecifications(root, "E-0")).resolves.toEqual([
    "specs/directives.yaml could not be read: blocked",
  ]);
  readFile.mockResolvedValue({});

  await expect(validateConsumerSpecifications(root, "E-0")).resolves.toEqual([
    "specs/directives.yaml is invalid YAML: source is not a string",
  ]);
});
