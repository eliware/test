import { expect, jest, test } from "@jest/globals";
import { projectScopedDirectoryEntries } from "../../../../../../src/validation/shared/repository/create-repository/directory/project-scoped-entries.mjs";

test("projects only records in the requested scope", async () => {
  const entriesUnder = jest.fn(async () => [
    { path: "src", type: "directory" },
    { path: "src/app.mjs", type: "file" },
    { path: "src/nested/item.mjs", type: "file" },
  ]);
  await expect(
    projectScopedDirectoryEntries("/repo/src", "src", {}, entriesUnder),
  ).resolves.toMatchObject([{ name: "app.mjs", path: "src/app.mjs" }]);
  expect(entriesUnder).toHaveBeenCalledWith("/repo/src", null, {});
});

test("rejects a scope that is absent from the inventory", async () => {
  await expect(
    projectScopedDirectoryEntries("/repo/missing", "missing", {}, async () => []),
  ).rejects.toMatchObject({ code: "ENOENT" });
});
