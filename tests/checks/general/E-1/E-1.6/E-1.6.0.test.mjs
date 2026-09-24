import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.6/E-1.6.0.mjs";

test("passes when tracked paths contain no forbidden artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  try {
    await expect(run({ root }, async () => [".env.example", "docs/readme.md"])).resolves.toEqual({
      ruleId: "E-1.6.0",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maps a forbidden tracked path and its exact exemption", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-"));
  try {
    await writeFile(join(root, "credentials.json"), "secret");
    await expect(run({ root }, async () => ["credentials.json"])).resolves.toMatchObject({
      ruleId: "E-1.6.0",
      status: "fail",
      message: expect.stringContaining("credentials.json"),
    });
    await expect(run({
      root,
      packageJson: { eliware: { exempt: [{ ruleId: "E-1.6.0", path: "credentials.json" }] } },
    }, async () => ["credentials.json"])).resolves.toEqual({
      ruleId: "E-1.6.0",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fails closed when Git cannot provide tracked-path evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-secrets-error-"));
  try {
    const expected = {
      ruleId: "E-1.6.0",
      status: "fail",
      message: "Repository contents could not be inspected for secret or runtime-state artifacts.",
    };
    await expect(run({ root }, async () => { throw new Error("git unavailable"); })).resolves.toEqual(expected);
    await expect(run({ root }, async () => null)).resolves.toEqual(expected);
    await expect(run({ root }, async () => [])).resolves.toEqual(expected);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses the default Git inspector for a real repository", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-1.6.0",
    status: "pass",
    message: "",
  });
});
