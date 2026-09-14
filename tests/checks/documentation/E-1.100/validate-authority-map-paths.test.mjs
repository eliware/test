import { expect, test } from "@jest/globals";
import { validateAuthorityMapPaths } from "../../../../src/checks/documentation/E-1.100/validate-authority-map-paths.mjs";

const context = { root: "C:\\repo", file: "C:\\repo\\authority-map.json" };

test("accepts empty optional path collections", async () => {
  await expect(validateAuthorityMapPaths(context)).resolves.toBeNull();
});

test("rejects malformed and unresolved path records", async () => {
  await expect(validateAuthorityMapPaths({ ...context, crosslinks: [null] })).resolves.toContain("crosslinks[0]");
  await expect(validateAuthorityMapPaths({ ...context, structuredDocuments: [null] })).resolves.toContain("structuredDocuments[0]");
  await expect(validateAuthorityMapPaths({ ...context, crosslinks: [{ path: "./missing" }] })).resolves.toContain("does not resolve");
});
