import { expect, test } from "@jest/globals";
import { validateInternalExportBarrels } from "../../../src/checks/shared/validate-internal-export-barrels.mjs";

test("rejects internal pure export barrels and permits declared public exports", async () => {
  const read = async (path) =>
    path.endsWith("public.mjs") || path.endsWith("internal.mjs")
      ? 'export { value } from "../value.mjs";'
      : "export const value = 1;";
  await expect(
    validateInternalExportBarrels(
      ["src/public.mjs", "src/internal.mjs", "src/value.mjs"],
      read,
      { exports: { ".": "./src/public.mjs" } },
      "repo",
    ),
  ).resolves.toEqual(["src/internal.mjs is an internal pure export barrel."]);
});

test("ignores empty sources and reports unreadable files as empty", async () => {
  await expect(
    validateInternalExportBarrels(["src/empty.mjs"], async () => "", {}, "repo"),
  ).resolves.toEqual([]);
  await expect(
    validateInternalExportBarrels(
      ["src/missing.mjs"],
      async () => {
        throw new Error("read");
      },
      {},
      "repo",
    ),
  ).resolves.toEqual(["src/missing.mjs could not be read to check export barrels."]);
});

test("finds public targets in arrays", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/public.mjs"],
      async () => 'export { value } from "../value.mjs";',
      { exports: ["./src/public.mjs"] },
      "repo",
    ),
  ).resolves.toEqual([]);
});

test("ignores invalid module syntax", async () => {
  await expect(
    validateInternalExportBarrels(["src/broken.mjs"], async () => "export {", {}, "repo"),
  ).resolves.toEqual([]);
});

test("accepts bare repository-relative main and bin targets", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/index.mjs", "src/cli.mjs"],
      async () => 'export { value } from "../value.mjs";',
      { main: "src/index.mjs", bin: { cli: "src/cli.mjs" } },
      "repo",
    ),
  ).resolves.toEqual([]);
});

test("ignores package aliases as bare runtime targets", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/internal.mjs"],
      async () => 'export { value } from "../value.mjs";',
      { main: "#private", bin: { cli: "node:process" } },
      "repo",
    ),
  ).resolves.toEqual(["src/internal.mjs is an internal pure export barrel."]);
});

test("does not count a types-only export condition as a runtime public target", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/internal.mjs"],
      async () => 'export { value } from "../value.mjs";',
      { exports: { ".": { types: "./src/internal.mjs" } } },
      "repo",
    ),
  ).resolves.toEqual(["src/internal.mjs is an internal pure export barrel."]);
});

test("uses default options", async () => {
  await expect(
    validateInternalExportBarrels([], async () => "", {}, "repo", null),
  ).resolves.toEqual([]);
});
