import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateUniqueSpecificationDirectiveIds } from "../../../../../src/checks/general/E-0.1/E-0.1.22/validate-unique-specification-directive-ids.mjs";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "eliware-specification-ids-"));
  await mkdir(join(root, "specs", "conventions"), { recursive: true });
  return root;
}

test("accepts unique directive IDs across specification files", async () => {
  const root = await fixture();
  await writeFile(join(root, "specs", "directives.json"), '{"directives":[{"id":"E-8"}]}');
  await writeFile(
    join(root, "specs", "conventions", "general.json"),
    '{"directives":[{"id":"E-9"}]}',
  );
  await writeFile(join(root, "specs", "README.md"), "Specification index");
  await expect(validateUniqueSpecificationDirectiveIds(root)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reads JSON files selected by the documentation inventory", async () => {
  let selectedJsonFile = false;
  let rejectedNonJsonFile = false;
  const inventory = {
    async documentationFiles({ predicate }) {
      selectedJsonFile = predicate("directives.json");
      rejectedNonJsonFile = !predicate("README.md");
      return ["directives.json"];
    },
    async readParsed(_path, _kind, parse) {
      return parse('{"directives":[{"id":"E-8"}]}');
    },
  };
  await expect(validateUniqueSpecificationDirectiveIds("/repo", inventory)).resolves.toBeNull();
  expect(selectedJsonFile).toBe(true);
  expect(rejectedNonJsonFile).toBe(true);
});

test("rejects duplicate directive IDs across specification files", async () => {
  const root = await fixture();
  await writeFile(join(root, "specs", "directives.json"), '{"directives":[{"id":"E-8"}]}');
  await writeFile(
    join(root, "specs", "conventions", "general.json"),
    '{"directives":[{"id":"E-8"}]}',
  );
  await expect(validateUniqueSpecificationDirectiveIds(root)).resolves.toContain(
    "Duplicate specification directive ID: E-8.",
  );
  await rm(root, { recursive: true, force: true });
});

test("skips non-object entries and checks nested directive IDs", async () => {
  const root = await fixture();
  await writeFile(
    join(root, "specs", "directives.json"),
    '{"directives":[null,"not a directive",{"id":7,"directives":[{"id":"E-10"}]}]}',
  );
  await expect(validateUniqueSpecificationDirectiveIds(root)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reports invalid JSON and continues through other specification files", async () => {
  const root = await fixture();
  await writeFile(join(root, "specs", "directives.json"), "{");
  await writeFile(join(root, "specs", "conventions", "general.json"), '{"directives":[]}');
  await expect(validateUniqueSpecificationDirectiveIds(root)).resolves.toContain(
    "directives.json could not be read as JSON",
  );
  await rm(root, { recursive: true, force: true });
});
