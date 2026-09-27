import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateLocalAuthorityNamespace } from "../../../../../src/checks/general/E-0.1/E-0.1.22/validate-local-authority-namespace.mjs";

async function writeAuthority(root, authority) {
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(join(root, "specs", "authority.json"), JSON.stringify(authority));
}

const directives = [{ id: "E-0.0", directives: [{ id: "A-0.0.1" }] }];

test("accepts a namespace assigned in authority metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, { subjects: [{ directives: [{ ids: ["E-0.0"] }] }] });
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reports namespaces that are not assigned", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, { subjects: [{ directives: [{ ids: ["E-19"] }] }] });
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBe(
    "Directive namespace E-0.0 is not assigned by specs/authority.json.",
  );
  await rm(root, { recursive: true, force: true });
});

test("does not treat a numeric namespace prefix as an assignment", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, { subjects: [{ directives: [{ ids: ["E-180"] }] }] });
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toContain(
    "namespace E-0.0 is not assigned",
  );
  await rm(root, { recursive: true, force: true });
});

test("does not let E-0 authorize a separate E-0.99 directive root", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, { subjects: [{ directives: [{ ids: ["E-0"] }] }] });
  await expect(validateLocalAuthorityNamespace(root, [{ id: "E-0.99" }])).resolves.toContain(
    "namespace E-0.99 is not assigned",
  );
  await rm(root, { recursive: true, force: true });
});

test("matches namespace assignments without case sensitivity", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, { subjects: [{ directives: [{ ids: ["e-0.0"] }] }] });
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toBeNull();
  await rm(root, { recursive: true, force: true });
});

test("reads authoritative namespace assignments through the repository inventory", async () => {
  const repositoryInventory = {
    readParsed: async () => ({ subjects: [{ directives: [{ ids: ["E-0.0"] }] }] }),
  };
  await expect(
    validateLocalAuthorityNamespace("/repo", directives, repositoryInventory),
  ).resolves.toBeNull();
});

test.each([
  { subjects: null },
  { subjects: [] },
  { subjects: [{}] },
  { subjects: [{ directives: [null, {}] }] },
  { subjects: [{ directives: [{ ids: [] }] }] },
])("rejects authority metadata without assigned namespaces: %j", async (authority) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await writeAuthority(root, authority);
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toContain(
    "authority.json",
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects unavailable or invalid authority metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-authority-namespace-"));
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toContain(
    "authority.json",
  );
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "authority.json"), "not json");
  await expect(validateLocalAuthorityNamespace(root, directives)).resolves.toContain(
    "authority.json",
  );
  await rm(root, { recursive: true, force: true });
});
