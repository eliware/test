import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSpecificationDirectiveDocuments } from "../../../../../src/checks/general/E-0.1/E-0.1.22/validate-specification-directive-documents.mjs";

const document = (directives) => ({ version: "9.0", description: "Fixture", directives });

async function fixture(directives) {
  const root = await mkdtemp(join(tmpdir(), "eliware-directive-documents-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), JSON.stringify(document(directives)));
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
    join(root, "specs", "metadata.json"),
    JSON.stringify({ version: "9.0", schema: {} }),
  );
  await writeFile(join(root, "specs", "ignored.json"), "null");
  await writeFile(join(root, "specs", "notes.txt"), "not JSON");
  await mkdir(join(root, "specs", "nested"));
  await writeFile(
    join(root, "specs", "nested", "more-directives.json"),
    JSON.stringify(document([{ id: "E-3", dos: ["Do."], donts: ["Do not."] }])),
  );
  await expect(validateSpecificationDirectiveDocuments(root)).resolves.toEqual([]);
  await rm(root, { recursive: true, force: true });
});

test("rejects invalid document fields, directive records, and hierarchy", async () => {
  const root = await fixture([{ id: "A-2", dos: [], donts: ["Do not."] }]);
  await writeFile(
    join(root, "specs", "directives.json"),
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

test("reports malformed specification JSON", async () => {
  const root = await fixture([{ id: "E-2", dos: ["Do."], donts: ["Do not."] }]);
  await writeFile(join(root, "specs", "broken.json"), "{");
  await expect(validateSpecificationDirectiveDocuments(root)).resolves.toEqual([
    expect.stringContaining("broken.json could not be read as JSON"),
  ]);
  await rm(root, { recursive: true, force: true });
});

test("validates document metadata and inventory-backed reads", async () => {
  const root = await fixture("wrong");
  const inventory = {
    documentationFiles: async ({ predicate }) => {
      expect(predicate("file.json")).toBe(true);
      expect(predicate("file.txt")).toBe(false);
      return ["directives.json"];
    },
    readParsed: async () => ({ version: "", description: 4, directives: "invalid" }),
  };
  await expect(validateSpecificationDirectiveDocuments(root, inventory)).resolves.toEqual(
    expect.arrayContaining([
      expect.stringContaining("directives.json.version must be a non-empty string"),
      expect.stringContaining("directives.json.description must be a non-empty string"),
      expect.stringContaining("directives.json.directives must be a non-empty array"),
    ]),
  );
  await rm(root, { recursive: true, force: true });
});

test("reports inventory read failures", async () => {
  const root = await fixture([]);
  const inventory = {
    documentationFiles: async () => ["directives.json"],
    readParsed: async () => {
      throw new Error("inventory read failed");
    },
  };
  await expect(validateSpecificationDirectiveDocuments(root, inventory)).resolves.toEqual([
    "directives.json could not be read as JSON: inventory read failed",
  ]);
  await rm(root, { recursive: true, force: true });
});
