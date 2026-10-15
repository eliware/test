import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { validateBundledSpecifications } from "../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled-specifications.mjs";

test("validates the suite schema and bundled convention files", async () => {
  await expect(validateBundledSpecifications()).resolves.toEqual([]);
});

test("reports invalid bundled files", async () => {
  const schemaError = await validateBundledSpecifications({
    read: async (path, encoding) =>
      String(path).endsWith("directives-schema.yaml") ? "invalid: [\n" : readFile(path, encoding),
  });
  expect(schemaError.join(" ")).toContain("Bundled specifications are missing or invalid");
  const readError = await validateBundledSpecifications({
    read: async (path, encoding) => {
      if (String(path).endsWith("general-deterministic.yaml")) throw new Error("blocked");
      return readFile(path, encoding);
    },
  });
  expect(readError.join(" ")).toContain("Bundled specifications are missing or invalid");
  const listError = await validateBundledSpecifications({
    readdir: async () => {
      throw new Error("blocked");
    },
  });
  expect(listError.join(" ")).toContain("Bundled specifications are missing or invalid");
});
