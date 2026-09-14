import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadStructuredJsonDocuments } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/load-structured-json-documents.mjs";

test("reports a file-specific diagnostic for malformed JSON", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-invalid-json-"));
  await writeFile(join(root, "broken.json"), "{");
  const result = await loadStructuredJsonDocuments(root);
  expect(result.error).toContain("broken.json");
});

test("reports filesystem discovery errors", async () => {
  const result = await loadStructuredJsonDocuments(join(tmpdir(), "eliware-test-missing-root"));
  expect(result.error).toContain("ENOENT");
});
