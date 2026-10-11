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

test("ignores invalid module syntax", async () => {
  await expect(
    validateInternalExportBarrels(["src/broken.mjs"], async () => "export {", {}, "repo"),
  ).resolves.toEqual([]);
});

test("allows every declared library target from conditional and array exports", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/index.mjs", "src/nested/index.mjs", "src/private.mjs"],
      async () => 'export { value } from "./value.mjs";',
      {
        main: "./src/index.mjs",
        exports: {
          ".": { import: ["./src/index.mjs"] },
          "./nested": ["./src/nested/index.mjs", "./src/private.mjs"],
          "./ignored": null,
        },
      },
      "repo",
      { library: true },
    ),
  ).resolves.toEqual([]);
});

test("accepts declared non-index exports without a root subpath", async () => {
  await expect(
    validateInternalExportBarrels(
      ["src/entry.mjs"],
      async () => 'export { value } from "./value.mjs";',
      { exports: { "./entry": { import: "./src/entry.mjs" } } },
      "repo",
      { library: true },
    ),
  ).resolves.toEqual([]);
});
