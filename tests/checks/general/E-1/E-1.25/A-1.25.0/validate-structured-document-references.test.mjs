import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadStructuredJsonDocuments } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/load-structured-json-documents.mjs";
import { validateStructuredDocumentReferences } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-structured-document-references.mjs";

async function validate(root) {
  const loaded = await loadStructuredJsonDocuments(root);
  return validateStructuredDocumentReferences({ root, documents: loaded.documents });
}

test("resolves local structured references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-refs-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "target.json"), "{}");
  await writeFile(
    join(root, "specs", "source.json"),
    JSON.stringify({ crosslink: { path: "./target.json" } }),
  );
  expect(await validate(root)).toBeNull();
  await mkdir(join(root, "records"));
  await writeFile(join(root, "records", "target.json"), "{}");
  await writeFile(
    join(root, "specs", "source.json"),
    JSON.stringify({ crosslink: { path: "../records/target.json" } }),
  );
  expect(await validate(root)).toBeNull();
  await writeFile(
    join(root, "specs", "source.json"),
    JSON.stringify({ crosslink: { path: "./missing.json" } }),
  );
  expect(await validate(root)).toContain("Structured reference");
});

test("allows a registered external crosslink when its checkout is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-external-reference-"));
  await writeFile(
    join(root, "authority.json"),
    JSON.stringify({ crosslinks: [{ path: "../external-repo/specs/authority.json" }] }),
  );
  expect(await validate(root)).toBeNull();
});

test("does not allow an ordinary document to self-register an unavailable external target", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-unregistered-reference-"));
  await writeFile(
    join(root, "source.json"),
    JSON.stringify({ crosslinks: [{ path: "../unregistered/specs/authority.json" }] }),
  );
  expect(await validate(root)).toContain("does not resolve to an available target");
});

test("rejects a crosslink object without a path", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-malformed-crosslink-"));
  await writeFile(join(root, "crosslinks.json"), JSON.stringify({ crosslinks: [{}] }));
  expect(await validate(root)).toContain("crosslinks[0] must be an object with a path");
});
