import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import packageMetadata from "../../../../../package.json" with { type: "json" };
import { validateSpecificationDirectiveDocuments } from "../../../../../src/checks/general/E-0.1/E-0.1.22/validate-specification-directive-documents.mjs";

const conventionVersion = packageMetadata.version.split(".").slice(0, 2).join(".");
const document = (directives) => ({
  version: conventionVersion,
  description: "Fixture",
  directives,
});

async function fixture(directives) {
  const root = await mkdtemp(join(tmpdir(), "eliware-directive-documents-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.yaml"), JSON.stringify(document(directives)));
  return root;
}

test("accepts schema-valid directive documents and ignores non-directive metadata", async () => {
  const root = await fixture([
    {
      id: "E-2",
      dos: ["Do."],
      donts: ["Do not."],
      directives: [{ id: "A-2.1", dos: ["Act."], donts: ["Do not omit it."] }],
    },
  ]);
  await writeFile(
    join(root, "specs", "metadata.yaml"),
    JSON.stringify({ version: conventionVersion, schema: {} }),
  );
  await writeFile(join(root, "specs", "ignored.yaml"), "null");
  await writeFile(join(root, "specs", "notes.txt"), "not JSON");
  await mkdir(join(root, "specs", "nested"));
  await writeFile(
    join(root, "specs", "nested", "more-directives.yaml"),
    JSON.stringify(document([{ id: "E-3", dos: ["Do."], donts: ["Do not."] }])),
  );
  await writeFile(
    join(root, "specs", "nested", "profile.yaml"),
    JSON.stringify({
      ...document([{ id: "E-4", dos: ["Do."], donts: ["Do not."] }]),
      requires: ["private"],
    }),
  );
  await expect(validateSpecificationDirectiveDocuments(root)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("rejects invalid document fields, directive records, and hierarchy", async () => {
  const root = await fixture([{ id: "A-2", dos: [], donts: ["Do not."] }]);
  await writeFile(
    join(root, "specs", "directives.yaml"),
    JSON.stringify({ ...document([{ id: "A-2", dos: [], donts: ["Do not."] }]), extra: true }),
  );
  await expect(validateSpecificationDirectiveDocuments(root)).resolves.toEqual(
    expect.arrayContaining([
      expect.stringContaining("unsupported directive-document fields"),
      expect.stringContaining("directives[0].dos must be a non-empty array"),
      expect.stringContaining("Top-level directive A-2 must be an E-rule"),
    ]),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects malformed profile requirements", async () => {
  const root = await fixture([]);
  await writeFile(
    join(root, "specs", "directives.yaml"),
    JSON.stringify({
      ...document([{ id: "E-1", dos: ["Do."], donts: ["Do not."] }]),
      requires: "private",
    }),
  );
  await expect(validateSpecificationDirectiveDocuments(root)).resolves.toEqual([
    "directives.yaml.requires must be an array of profile names.",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("reports malformed specification JSON", async () => {
  const root = await fixture([{ id: "E-2", dos: ["Do."], donts: ["Do not."] }]);
  await writeFile(join(root, "specs", "broken.yaml"), "{");
  await expect(validateSpecificationDirectiveDocuments(root)).resolves.toEqual([
    expect.stringContaining("broken.yaml could not be read as YAML"),
  ]);
  await rm(root, { recursive: true, force: true });
});

test("validates document metadata and inventory-backed reads", async () => {
  const root = await fixture("wrong");
  const inventory = {
    documentationFiles: async ({ predicate }) => {
      expect(predicate("file.yaml")).toBe(true);
      expect(predicate("file.txt")).toBe(false);
      return ["directives.yaml"];
    },
    readParsed: async () => ({ version: "", description: 4, directives: "invalid" }),
  };
  await expect(validateSpecificationDirectiveDocuments(root, inventory)).resolves.toEqual(
    expect.arrayContaining([
      expect.stringContaining("directives.yaml.version must be a non-empty string"),
      expect.stringContaining("directives.yaml.description must be a non-empty string"),
      expect.stringContaining("directives.yaml.directives must be a non-empty array"),
    ]),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports inventory read failures", async () => {
  const root = await fixture([]);
  const inventory = {
    documentationFiles: async () => ["directives.yaml"],
    readParsed: async () => {
      throw new Error("inventory read failed");
    },
  };
  await expect(validateSpecificationDirectiveDocuments(root, inventory)).resolves.toEqual([
    "directives.yaml could not be read as YAML: inventory read failed",
  ]);
  await rm(root, { recursive: true, force: true });
});

test("validates E-number namespaces recursively through nested YAML specs", async () => {
  const root = await fixture([{ id: "E-2", dos: ["Do."], donts: ["Do not."] }]);
  await mkdir(join(root, "specs", "nested"));
  await writeFile(
    join(root, "specs", "nested", "rules.yaml"),
    JSON.stringify(document([{ id: "E-9.1", dos: ["Do."], donts: ["Do not."] }])),
  );
  await expect(validateSpecificationDirectiveDocuments(root, null, "E-2")).resolves.toEqual(
    expect.arrayContaining([
      expect.stringContaining("rules.yaml rule E-9.1 must use the assigned E-2 namespace"),
    ]),
  );
  await expect(validateSpecificationDirectiveDocuments(root, null, "bad-id")).resolves.toEqual(
    expect.arrayContaining([expect.stringContaining("must use the E-<number> form")]),
  );
  await rm(root, { recursive: true, force: true });
});
