import { expect, test } from "@jest/globals";
import { validateInternalExportBarrels } from "../../../../src/checks/application/E-0.1.4.1.2/validate-internal-export-barrels.mjs";

test("rejects internal pure export barrels and permits declared public exports", async () => {
  const read = async (path) =>
    path.endsWith("public.mjs") || path.endsWith("internal.mjs")
      ? 'export { value } from "./value.mjs";'
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
      async () => 'export { value } from "./value.mjs";',
      { exports: ["./src/public.mjs"] },
      "repo",
    ),
  ).resolves.toEqual([]);
});

test("detects pure re-exports with comments and multiline syntax", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/internal.mjs"],
      async () => '// public surface\nexport {\n  value,\n} from "./value.mjs";',
      {},
      "repo",
    ),
  ).resolves.toEqual(["src/internal.mjs is an internal pure export barrel."]);
});

test("ignores invalid module syntax", async () => {
  await expect(
    validateInternalExportBarrels(["src/broken.mjs"], async () => "export {", {}, "repo"),
  ).resolves.toEqual([]);
});

test("detects export-all barrels", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/internal.mjs"],
      async () => 'export * from "./values.mjs";',
      {},
      "repo",
    ),
  ).resolves.toEqual(["src/internal.mjs is an internal pure export barrel."]);
});
