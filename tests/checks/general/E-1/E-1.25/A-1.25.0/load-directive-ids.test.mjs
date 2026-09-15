import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { loadDirectiveIds } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/load-directive-ids.mjs";

test("loads nested directive IDs from the local directive document", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), JSON.stringify({ directives: [{ id: "E-1", directives: [{ id: "A-1.0" }] }] }));
  await expect(loadDirectiveIds(root)).resolves.toEqual({ ids: new Set(["E-1", "A-1.0"]) });
  await rm(root, { recursive: true, force: true });
});

test("returns no IDs when the local document is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-missing-"));
  await expect(loadDirectiveIds(root)).resolves.toEqual({ ids: null });
  await rm(root, { recursive: true, force: true });
});

test("reports invalid JSON and tolerates nodes without directive children", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-invalid-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), JSON.stringify({ directives: [{ id: "E-1" }, null] }));
  await expect(loadDirectiveIds(root)).resolves.toEqual({ ids: new Set(["E-1"]) });
  await writeFile(join(root, "specs", "directives.json"), "not json");
  await expect(loadDirectiveIds(root)).resolves.toEqual(expect.objectContaining({ error: expect.stringContaining("invalid") }));
  await rm(root, { recursive: true, force: true });
});

test("merges IDs from explicitly linked external directives", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-external-"));
  await mkdir(join(root, "specs"), { recursive: true });
  await mkdir(join(root, "external"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: [{ path: "../external/directives.json", ids: ["E-99"] }, {}] }] }));
  await writeFile(join(root, "external", "directives.json"), JSON.stringify({ directives: [{ id: "E-99", directives: [null] }] }));
  await expect(loadDirectiveIds(root)).resolves.toEqual({ ids: new Set(["E-99"]) });
  await rm(root, { recursive: true, force: true });
});

test("fails closed when authority or linked directive documents are invalid", async () => {
  const authorityError = await mkdtemp(join(tmpdir(), "eliware-directives-authority-error-"));
  await mkdir(join(authorityError, "specs"));
  await writeFile(join(authorityError, "specs", "authority.json"), "not json");
  await expect(loadDirectiveIds(authorityError)).resolves.toEqual(expect.objectContaining({ error: expect.stringContaining("authority.json") }));
  await rm(authorityError, { recursive: true, force: true });

  const linkedError = await mkdtemp(join(tmpdir(), "eliware-directives-linked-error-"));
  await mkdir(join(linkedError, "specs"));
  await writeFile(join(linkedError, "specs", "directives.json"), JSON.stringify({ directives: [] }));
  await writeFile(join(linkedError, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: [{ path: "../bad.json" }] }] }));
  await writeFile(join(linkedError, "bad.json"), "not json");
  await expect(loadDirectiveIds(linkedError)).resolves.toEqual(expect.objectContaining({ error: expect.stringContaining("Linked directive") }));
  await rm(linkedError, { recursive: true, force: true });
});

test("uses linked IDs when the local directive document is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-linked-only-"));
  await mkdir(join(root, "specs"));
  await mkdir(join(root, "external"));
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: [{ path: "../external/directives.json", ids: ["E-99"] }] }] }));
  await writeFile(join(root, "external", "directives.json"), JSON.stringify({ directives: [{ id: "E-99" }] }));
  await expect(loadDirectiveIds(root)).resolves.toEqual({ ids: new Set(["E-99"]) });
  await rm(root, { recursive: true, force: true });
});

test("merges linked IDs into an existing local authority", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-merge-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), JSON.stringify({ directives: [{ id: "E-1" }] }));
  await mkdir(join(root, "external"));
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: [{ path: "../external/directives.json", ids: ["E-99"] }] }] }));
  await writeFile(join(root, "external", "directives.json"), JSON.stringify({ directives: [{ id: "E-99" }] }));
  await expect(loadDirectiveIds(root)).resolves.toEqual({ ids: new Set(["E-1", "E-99"]) });
  await rm(root, { recursive: true, force: true });
});
