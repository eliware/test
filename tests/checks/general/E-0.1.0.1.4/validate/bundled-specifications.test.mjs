import { expect, test } from "@jest/globals";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { validateBundledSpecifications } from "../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled-specifications.mjs";

test("validates the suite schema and bundled convention files", async () => {
  await expect(validateBundledSpecifications()).resolves.toEqual([]);
});

test("keeps the package.json prohibition as its own donts item", async () => {
  const document = parse(
    await readFile(
      new URL("../../../../../specs/conventions/general-deterministic.yaml", import.meta.url),
      "utf8",
    ),
  );
  const rule = document.directives.find(({ id }) => id === "E-0.1.0.1.8");
  expect(rule.dos).toContain("Ignore .DS_Store and Thumbs.db.");
  expect(rule.dos).not.toContain("Do not ignore package.json.");
  expect(rule.donts).toContain("Do not ignore package.json.");
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
