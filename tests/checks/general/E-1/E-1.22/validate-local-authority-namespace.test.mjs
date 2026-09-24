import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateLocalAuthorityNamespace } from "../../../../../src/checks/general/E-1/E-1.22/validate-local-authority-namespace.mjs";

async function writeAuthority(root, authority) {
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify(authority));
}

const directives = [{ id: "E-18", directives: [{ id: "A-18.1" }] }];

test("accepts a namespace assigned in authority metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, { subjects: [{ directives: [{ ids: ["E-18"] }] }] });
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reports namespaces that are not assigned", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, { subjects: [{ directives: [{ ids: ["E-19"] }] }] });
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBe(
    "Directive namespace E-18 is not assigned by specs/authority.json.",
  );
  await rm(root, { recursive: true, force: true });
});

test.each([
  { subjects: null },
  { subjects: [] },
  { subjects: [{}] },
  { subjects: [{ directives: [null, {}] }] },
  { subjects: [{ directives: [{ ids: [] }] }] },
])("ignores authority metadata without assigned namespaces: %j", async (authority) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, authority);
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("treats unavailable or invalid authority metadata as no namespace assignment", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBeNull();
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "authority.json"), "not json");
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});
