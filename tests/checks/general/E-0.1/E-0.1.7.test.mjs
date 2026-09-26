import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.7.mjs";

test("rejects infrastructure-internal identifiers", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-"));
  await writeFile(
    join(root, "config.json"),
    JSON.stringify({ host: ["db", "internal", "eliware", "org"].join(".") }),
  );
  await expect(run({ root, files: ["config.json"] })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});

test("inspects tracked files when no file list is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-discovery-"));
  await writeFile(join(root, "config.json"), '{"host":"localhost"}');
  await expect(
    run({ root, files: null, readTracked: async () => ["config.json"] }),
  ).resolves.toEqual({
    ruleId: "E-0.1.7",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("reads tracked source bytes through the shared repository inventory", async () => {
  const repositoryInventory = { readBytes: jest.fn(async () => Buffer.from("Public content.")) };
  await expect(
    run({ root: "/repo", files: ["src/public.mjs"], repositoryInventory }),
  ).resolves.toEqual({ ruleId: "E-0.1.7", status: "pass", message: "" });
  expect(repositoryInventory.readBytes).toHaveBeenCalledWith(join("/repo", "src/public.mjs"));
});

test("skips tracked paths deleted from the current working tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-deleted-"));
  await expect(
    run({ root, readTracked: async () => ["scripts/removed.mjs"] }),
  ).resolves.toEqual({ ruleId: "E-0.1.7", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("skips public-content scanning for private repositories", async () => {
  const readTracked = jest.fn();
  await expect(
    run({ root: "/repo", packageJson: { private: true }, readTracked }),
  ).resolves.toEqual({
    ruleId: "E-0.1.7",
    status: "pass",
    message: "",
  });
  expect(readTracked).not.toHaveBeenCalled();
});

test("fails closed when tracked-file inspection is unavailable", async () => {
  await expect(run({ root: "/repo", readTracked: async () => null })).resolves.toEqual({
    ruleId: "E-0.1.7",
    status: "fail",
    message:
      "Git tracked-file inspection was unavailable; cannot validate public repository contents safely.",
  });
});

test("reports unreadable repository files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-error-"));
  await expect(run({ root, files: ["missing.json"] })).resolves.toEqual({
    ruleId: "E-0.1.7",
    status: "fail",
    message: expect.stringContaining("Repository files could not be inspected"),
  });
  await rm(root, { recursive: true, force: true });
});
