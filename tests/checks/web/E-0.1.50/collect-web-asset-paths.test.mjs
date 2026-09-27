import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { collectWebAssetPaths } from "../../../../src/checks/web/E-0.1.50/collect-web-asset-paths.mjs";

test("recursively collects paths and skips excluded directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-assets-"));
  await mkdir(join(root, "assets"));
  await mkdir(join(root, "dist"));
  await writeFile(join(root, "assets", "app.js"), "ok");
  await writeFile(join(root, "dist", "bundle.js"), "ok");
  await expect(collectWebAssetPaths(root, "", null, ["dist"])).resolves.toEqual(
    expect.arrayContaining(["assets", "assets/app.js", "dist"]),
  );
  await expect(collectWebAssetPaths(root, "", null, ["dist"])).resolves.not.toContain("dist/bundle.js");
  await expect(collectWebAssetPaths(root)).resolves.toContain("dist/bundle.js");
  await rm(root, { recursive: true, force: true });
});

test("uses the injected inventory reader and recurses through unexcluded entries", async () => {
  const inventory = {
    directoryEntries: async (directory) => directory.endsWith("public")
      ? [{ name: "assets", isDirectory: () => true }, { name: "index.html", isDirectory: () => false }]
      : [{ name: "app.js", isDirectory: () => false }],
  };
  await expect(collectWebAssetPaths("/repo/public", "", inventory)).resolves.toEqual([
    "assets", "assets/app.js", "index.html",
  ]);
});
