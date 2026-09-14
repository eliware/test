import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.6/E-1.6.0.mjs";

test("permits the example environment file and ignores generated directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, ".env.example"), "SAFE=value\n");
  await writeFile(join(root, "node_modules", "secret.pem"), "ignored");
  await expect(run({ root }, async () => [".env.example"])).resolves.toEqual({
    ruleId: "E-1.6.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects credential and key artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  await writeFile(join(root, "credentials.json"), "secret");
  await expect(run({ root }, async () => ["credentials.json"])).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("credentials.json"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test.each([
  "decrypted-data.json",
  "private-conversations.json",
  "database-state.sqlite",
  "runtime-state.json",
  "production.dump",
  "restore.tar.gz",
  "session.json",
  "id_ed25519",
])("rejects sensitive or machine-state artifact %s", async (name) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  await writeFile(join(root, name), "sensitive");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining(name) }),
  );
  await rm(root, { recursive: true, force: true });
});

test.each(["docs/conversation-guide.md", "bootstrap-schema.sql", "seed-records.json"])(
  "permits non-sensitive artifact %s",
  async (name) => {
    const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
    await mkdir(join(root, name.split("/").slice(0, -1).join("/")), { recursive: true }).catch(
      () => {},
    );
    await writeFile(join(root, name), "safe");
    await expect(run({ root }, async () => [name])).resolves.toEqual({
      ruleId: "E-1.6.0",
      status: "pass",
      message: "",
    });
    await rm(root, { recursive: true, force: true });
  },
);

test("permits an exact approved path exemption", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  await writeFile(join(root, "credentials.json"), "approved");
  await expect(
    run({
      root,
      packageJson: { eliware: { exempt: [{ ruleId: "E-1.6.0", path: "credentials.json" }] } },
    }),
  ).resolves.toEqual({ ruleId: "E-1.6.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("filters tracked paths and honors tracked-path exemptions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-tracked-"));
  await expect(
    run(
      {
        root,
        packageJson: { eliware: { exempt: [{ ruleId: "E-1.6.0", path: "credentials.json" }] } },
      },
      async () => ["credentials.json", "safe.json", ".env.example"],
    ),
  ).resolves.toEqual({ ruleId: "E-1.6.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("uses Git tracked files when the repository is available", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-1.6.0",
    status: "pass",
    message: "",
  });
});

test("fails closed when repository inspection cannot run", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-error-"));
  const expected = expect.objectContaining({
    ruleId: "E-1.6.0",
    status: "fail",
    message: "Repository contents could not be inspected for secret or runtime-state artifacts.",
  });
  await expect(run({ root }, async () => { throw new Error("git unavailable"); })).resolves.toEqual(expected);
  await expect(run({ root }, async () => null)).resolves.toEqual(expected);
  await rm(root, { recursive: true, force: true });
});

test("fails closed when fallback filesystem inspection cannot run", async () => {
  await expect(run({ root: join(tmpdir(), "eliware-test-missing-secrets-root") })).resolves.toEqual({
    ruleId: "E-1.6.0",
    status: "fail",
    message: "Repository contents could not be inspected for secret or runtime-state artifacts.",
  });
});
