import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/general/E-1/E-1.8.mjs";


test("requires the repository mailbox owner in local .env only", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  const packageJson = { name: "@eliware/fixture" };
  const checkIgnored = async (_root, path) => path === ".env";
  await expect(run({ root, packageJson })).resolves.toMatchObject({ status: "fail" });
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(run({ root, packageJson, trackedFiles: [], checkIgnored })).resolves.toMatchObject({ status: "pass" });
  await writeFile(join(root, ".env.example"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(run({ root, packageJson, checkIgnored })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("requires a package name and local environment file", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-missing-"));
  await expect(run({ root, packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.8",
    status: "fail",
    message: "package.json.name is required to derive the mailbox owner.",
  });
  await expect(run({ root, packageJson: { name: "@eliware/fixture" } })).resolves.toEqual({
    ruleId: "E-1.8",
    status: "fail",
    message: "Local .env must define the mailbox owner as fixture@eliware.org.",
  });
  await rm(root, { recursive: true, force: true });
});

test.each([
  "MAILBOX_OWNER=fixture@eliware.org",
  "MAIL_OWNER_ADDRESS=other@eliware.org",
  "MAIL_OWNER_ADDRESS=fixture@other.org",
])("rejects a non-canonical mailbox declaration: %s", async (line) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  await writeFile(join(root, ".env"), `${line}\n`);
  await expect(run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [], checkIgnored: async () => true })).resolves.toMatchObject({
    status: "fail",
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects a tracked local .env", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(
    run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [".env"], checkIgnored: async () => true }),
  ).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("fails closed when Git tracking inspection is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-unavailable-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(run({ root, packageJson: { name: "@eliware/fixture" }, readTracked: async () => null, checkIgnored: async () => true }))
    .resolves.toMatchObject({ status: "fail", message: expect.stringContaining("Git tracking inspection") });
  await rm(root, { recursive: true, force: true });
});

test("filters untracked environment templates through Git", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-template-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(run({ root, packageJson: { name: "@eliware/fixture" }, readTracked: async () => [], checkIgnored: async (_root, file) => file === ".env" }))
    .resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("rejects a local .env that Git would track", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [], checkIgnored: async () => false })).resolves.toMatchObject({
    status: "fail",
    message: "The local mailbox owner file .env must be ignored by Git.",
  });
  await rm(root, { recursive: true, force: true });
});

test("accepts a quoted canonical mailbox declaration", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  await writeFile(join(root, ".env"), 'export MAIL_OWNER_ADDRESS="fixture@eliware.org"\n');
  await expect(run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [], checkIgnored: async () => true })).resolves.toMatchObject({
    status: "pass",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports environment discovery and template read failures", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-errors-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(
    run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [], checkIgnored: async () => true, findFiles: async () => { throw new Error("scan failed"); } }),
  ).resolves.toEqual(expect.objectContaining({ message: "Environment files could not be inspected: scan failed" }));
  await expect(
    run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [".env.example"], checkIgnored: async () => true, findFiles: async () => [".env.example"] }),
  ).resolves.toEqual(expect.objectContaining({ message: expect.stringContaining("Environment template could not be inspected") }));
  await rm(root, { recursive: true, force: true });
});
