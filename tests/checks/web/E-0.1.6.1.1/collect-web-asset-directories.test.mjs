import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { collectWebAssetDirectories } from "../../../../src/checks/web/E-0.1.6.1.1/collect-web-asset-directories.mjs";

function entry(name, directory = true) {
  return { name, isDirectory: () => directory };
}

test("collects excluded directories from repository inventory", async () => {
  const inventory = {
    directoryEntries: async (path) => {
      if (path === resolve("/repo/public")) return [entry("assets"), entry("node_modules")];
      if (path === resolve("/repo/public/assets"))
        return [entry("coverage"), entry("logo.svg", false)];
      return [];
    },
  };
  await expect(collectWebAssetDirectories(resolve("/repo/public"), inventory)).resolves.toEqual([
    "assets/coverage",
    "node_modules",
  ]);
});

test("reads directories when no repository inventory is available", async () => {
  const readDirectory = async (path) =>
    path === resolve("/repo/public") ? [entry("dist"), entry("images")] : [];
  await expect(
    collectWebAssetDirectories(resolve("/repo/public"), null, { readDirectory }),
  ).resolves.toEqual(["dist"]);
});
