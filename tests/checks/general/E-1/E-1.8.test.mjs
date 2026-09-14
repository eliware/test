import { expect, test } from "@jest/globals";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { run } from "../../../../src/checks/general/E-1/E-1.8.mjs";

const execFileAsync = promisify(execFile);

test("requires the repository mailbox owner in local .env only", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  const packageJson = { name: "@eliware/fixture" };
  await expect(run({ root, packageJson })).resolves.toMatchObject({ status: "fail" });
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(run({ root, packageJson })).resolves.toMatchObject({ status: "pass" });
  await writeFile(join(root, ".env.example"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(run({ root, packageJson })).resolves.toMatchObject({ status: "fail" });
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
  await expect(run({ root, packageJson: { name: "@eliware/fixture" } })).resolves.toMatchObject({
    status: "fail",
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects a tracked local .env", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(
    run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [".env"] }),
  ).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("accepts a quoted canonical mailbox declaration", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-"));
  await writeFile(join(root, ".env"), 'export MAIL_OWNER_ADDRESS="fixture@eliware.org"\n');
  await expect(run({ root, packageJson: { name: "@eliware/fixture" } })).resolves.toMatchObject({
    status: "pass",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports environment discovery and template read failures", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-errors-"));
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await expect(
    run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [], findFiles: async () => { throw new Error("scan failed"); } }),
  ).resolves.toEqual(expect.objectContaining({ message: "Environment files could not be inspected: scan failed" }));
  await expect(
    run({ root, packageJson: { name: "@eliware/fixture" }, trackedFiles: [], findFiles: async () => [".env.example"] }),
  ).resolves.toEqual(expect.objectContaining({ message: expect.stringContaining("Environment template could not be inspected") }));
  await rm(root, { recursive: true, force: true });
});

test("reads tracked paths from Git when no override is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-mailbox-git-"));
  await execFileAsync("git", ["-C", root, "init"], { windowsHide: true });
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await writeFile(join(root, ".env.local"), "OTHER=value\n");
  await writeFile(join(root, "config.json"), "public");
  await expect(run({ root, packageJson: { name: "@eliware/fixture" } })).resolves.toEqual({
    ruleId: "E-1.8",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});
