import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { loadLinkedDirectiveIds } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/load-linked-directive-ids.mjs";

test("loads explicitly linked directive IDs and nested external directives", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-linked-directives-"));
  await mkdir(join(root, "specs"), { recursive: true });
  await mkdir(join(root, "external"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: [{ path: "../external/directives.json", ids: ["E-99"] }] }] }));
  await writeFile(join(root, "external", "directives.json"), JSON.stringify({ directives: [{ id: "E-99", directives: [{ id: "A-99.1" }] }] }));
  await expect(loadLinkedDirectiveIds(root)).resolves.toEqual({ ids: new Set(["E-99", "A-99.1"]) });
  await rm(root, { recursive: true, force: true });
});

test("returns declared IDs when an explicitly linked external document is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-linked-directives-missing-"));
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: [{ path: "../../conventions/specs/general.json", ids: ["E-1"] }] }] }));
  await expect(loadLinkedDirectiveIds(root)).resolves.toEqual({ ids: new Set(["E-1"]) });
  await rm(root, { recursive: true, force: true });
});

test("reports malformed authority and linked directive documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-linked-directives-invalid-"));
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), "not json");
  await expect(loadLinkedDirectiveIds(root)).resolves.toEqual(expect.objectContaining({ error: expect.stringContaining("authority.json is invalid") }));
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: [{ path: "external.json" }] }] }));
  await writeFile(join(root, "specs", "external.json"), "not json");
  await expect(loadLinkedDirectiveIds(root)).resolves.toEqual(expect.objectContaining({ error: expect.stringContaining("external.json is invalid") }));
  await rm(root, { recursive: true, force: true });
});

test("ignores authority subjects without directive link records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-linked-directives-empty-"));
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({ subjects: [{ directives: "not-an-array" }] }));
  await expect(loadLinkedDirectiveIds(root)).resolves.toEqual({ ids: new Set() });
  await rm(root, { recursive: true, force: true });
});

test("accepts an authority document without subjects", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-linked-directives-no-subjects-"));
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify({}));
  await expect(loadLinkedDirectiveIds(root)).resolves.toEqual({ ids: new Set() });
  await rm(root, { recursive: true, force: true });
});
