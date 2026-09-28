import { beforeEach, expect, jest, test } from "@jest/globals";

const resolveWebAssetSettings = jest.fn();
const collectWebAssetPaths = jest.fn();
const findExcludedWebAssets = jest.fn();
jest.unstable_mockModule(
  "../../../../src/checks/web/E-0.1.50/resolve-web-asset-settings.mjs",
  () => ({ resolveWebAssetSettings }),
);
jest.unstable_mockModule("../../../../src/checks/web/E-0.1.50/collect-web-asset-paths.mjs", () => ({
  collectWebAssetPaths,
}));
jest.unstable_mockModule(
  "../../../../src/checks/web/E-0.1.50/find-excluded-web-assets.mjs",
  () => ({ findExcludedWebAssets }),
);

const { run } = await import("../../../../src/checks/web/E-0.1.50/E-0.1.50.1.mjs");
const settings = {
  assetRoot: "public",
  resolvedAssets: "/repo/public",
  exclusions: ["dist"],
};

beforeEach(() => {
  jest.resetAllMocks();
  resolveWebAssetSettings.mockReturnValue(settings);
  collectWebAssetPaths.mockResolvedValue(["index.html"]);
  findExcludedWebAssets.mockReturnValue([]);
});

test("coordinates settings, asset collection, and exclusion validation", async () => {
  const packageJson = {};
  const repositoryInventory = { directoryEntries: jest.fn() };

  await expect(run({ root: "/repo", packageJson, repositoryInventory })).resolves.toEqual({
    ruleId: "E-0.1.50.1",
    status: "pass",
    message: "",
  });
  expect(resolveWebAssetSettings).toHaveBeenCalledWith("/repo", packageJson);
  expect(collectWebAssetPaths).toHaveBeenCalledWith(
    settings.resolvedAssets,
    undefined,
    repositoryInventory,
    settings.exclusions,
  );
  expect(findExcludedWebAssets).toHaveBeenCalledWith(["index.html"], settings.exclusions);
});

test("reports every excluded path returned by the exclusion validator", async () => {
  findExcludedWebAssets.mockReturnValueOnce(["dist/app.js", "build/site.css"]);

  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "E-0.1.50.1",
    status: "fail",
    message:
      "Web public assets must not include excluded output: dist/app.js.\n" +
      "Web public assets must not include excluded output: build/site.css.",
  });
});

test("skips only traversal when settings are invalid and maps unreadable asset roots", async () => {
  resolveWebAssetSettings.mockReturnValueOnce({ error: "invalid asset settings" });
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toMatchObject({
    status: "fail",
    message: "invalid asset settings",
  });
  expect(collectWebAssetPaths).not.toHaveBeenCalled();

  collectWebAssetPaths.mockRejectedValueOnce(new Error("missing"));
  await expect(run({ root: "/repo", packageJson: {} })).resolves.toEqual({
    ruleId: "E-0.1.50.1",
    status: "fail",
    message: "public/ is required as the web public asset root.",
  });
  expect(findExcludedWebAssets).not.toHaveBeenCalled();
});
