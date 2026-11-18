import { expect, test } from "@jest/globals";
import discoverAllChecks from "../../../../../src/validation/check-discovery/discover/checks/discover-all-checks.mjs";

test("discovers sorted groups and returns an empty registry for a missing default root", async () => {
  const readDirectory = async (path) =>
    path === "C:/checks"
      ? [
          { name: ".hidden", isDirectory: () => true },
          { name: "z-group", isDirectory: () => true },
          { name: "a-group", isDirectory: () => true },
        ]
      : [];
  await expect(discoverAllChecks({ root: "C:/checks", readDirectory })).resolves.toEqual([]);
  await expect(
    discoverAllChecks({
      readDirectory: async () => {
        throw Object.assign(new Error("missing"), { code: "ENOENT" });
      },
    }),
  ).resolves.toEqual([]);
  await expect(
    discoverAllChecks({
      root: "C:/checks",
      readDirectory: async () => {
        throw new Error("denied");
      },
    }),
  ).rejects.toThrow("denied");
});
