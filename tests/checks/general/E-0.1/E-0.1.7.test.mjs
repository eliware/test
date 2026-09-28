import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-0.1/E-0.1.7.mjs";

test("rejects infrastructure-internal identifiers in current files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-"));
  try {
    await writeFile(
      join(root, "config.json"),
      JSON.stringify({ host: ["db", "internal", "eliware", "org"].join(".") }),
    );
    await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovers current files from disk without tracked-file input", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-discovery-"));
  try {
    await writeFile(join(root, "config.json"), '{"host":"localhost"}');
    await expect(run({ root })).resolves.toEqual({
      ruleId: "E-0.1.7",
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("scans current files even when they match the repository's .gitignore", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-internal-ignored-"));
  try {
    await writeFile(join(root, ".gitignore"), "config.json\n");
    await writeFile(
      join(root, "config.json"),
      JSON.stringify({ host: ["db", "internal", "eliware", "org"].join(".") }),
    );
    await expect(run({ root })).resolves.toEqual({
      ruleId: "E-0.1.7",
      status: "fail",
      message: expect.stringContaining("config.json"),
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads current source bytes through the shared repository inventory", async () => {
  const repositoryInventory = {
    repositoryFiles: jest.fn(async () => ["src/public.mjs"]),
    readBytes: jest.fn(async () => Buffer.from("Public content.")),
  };
  await expect(run({ root: "/repo", repositoryInventory })).resolves.toEqual({
    ruleId: "E-0.1.7",
    status: "pass",
    message: "",
  });
  expect(repositoryInventory.readBytes).toHaveBeenCalledWith(join("/repo", "src/public.mjs"));
});

test("skips public-content scanning for private repositories", async () => {
  const findFiles = jest.fn();
  await expect(run({ root: "/repo", packageJson: { private: true }, findFiles })).resolves.toEqual({
    ruleId: "E-0.1.7",
    status: "pass",
    message: "",
  });
  expect(findFiles).not.toHaveBeenCalled();
});

test("reports unreadable repository files", async () => {
  await expect(run({ root: "/repo", files: ["missing.json"] })).resolves.toEqual({
    ruleId: "E-0.1.7",
    status: "fail",
    message: expect.stringContaining("Repository files could not be inspected"),
  });
});
