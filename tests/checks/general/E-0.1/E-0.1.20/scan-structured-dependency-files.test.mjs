import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanStructuredDependencyFiles } from "../../../../../src/checks/general/E-0.1/E-0.1.20/scan-structured-dependency-files.mjs";

test("collects dependency references from recognized structured files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-structured-dependency-scan-"));
  try {
    await mkdir(join(root, "src"));
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { build: "dep" } }));
    await writeFile(join(root, "src", "ignored.json"), JSON.stringify({ name: "dep" }));
    const referenced = new Set();

    await scanStructuredDependencyFiles(
      root,
      ["README.md", "package.json", "src/ignored.json"],
      ["dep"],
      referenced,
    );

    expect(referenced.has("dep")).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads structured documents through the shared inventory cache", async () => {
  const inventory = {
    readParsed: jest.fn(async () => ({ scripts: { build: "dep" } })),
  };
  const referenced = new Set();

  await scanStructuredDependencyFiles("/repo", ["package.json"], ["dep"], referenced, inventory);

  expect(inventory.readParsed).toHaveBeenCalledWith(
    join("/repo", "package.json"),
    "json",
    JSON.parse,
  );
  expect(referenced.has("dep")).toBe(true);
});
