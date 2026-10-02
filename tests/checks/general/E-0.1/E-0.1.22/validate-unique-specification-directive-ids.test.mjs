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
  await writeFile(join(root, "specs", "directives.yaml"), '{"directives":[{"id":"E-8"}]}');
  await writeFile(
    join(root, "specs", "conventions", "general.yaml"),
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
      selectedJsonFile = predicate("directives.yaml");
      rejectedNonJsonFile = !predicate("README.md");
      return ["directives.yaml"];
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
  await writeFile(join(root, "specs", "directives.yaml"), '{"directives":[{"id":"E-8"}]}');
  await writeFile(
    join(root, "specs", "conventions", "general.yaml"),
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
    join(root, "specs", "directives.yaml"),
    '{"directives":[null,"not a directive",{"id":7,"directives":[{"id":"E-10"}]}]}',
  );
  await expect(validateUniqueSpecificationDirectiveIds(root)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reports invalid YAML and continues through other specification files", async () => {
  const root = await fixture();
  await writeFile(join(root, "specs", "directives.yaml"), "{");
  await writeFile(join(root, "specs", "conventions", "general.yaml"), '{"directives":[]}');
  await expect(validateUniqueSpecificationDirectiveIds(root)).resolves.toContain(
    "directives.yaml could not be read as YAML",
  );
  await rm(root, { recursive: true, force: true });
});
