import { expect, jest, test } from "@jest/globals";
import { stringify } from "yaml";
import { expectedDirectiveSchema } from "../../../../../src/checks/general/E-0.1.0.1.4/validate/directive-schema.mjs";

const readFile = jest.fn();
const readdir = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, readdir }));
const { validateBundledSpecifications } =
  await import("../../../../../src/checks/general/E-0.1.0.1.4/validate/bundled-specifications.mjs");

const fixture = {
  root: "/suite",
  packageJson: { eliware: { id: "E-0" } },
  entries: [],
  read: async () => stringify(expectedDirectiveSchema),
};
const convention = {
  version: "13.0",
  description: "Test convention.",
  directives: [{ id: "E-0.0", dos: ["Keep tests focused."], donts: ["Do not mix test duties."] }],
};

test("validates the supplied suite schema and convention inventory", async () => {
  const entries = [{ path: "specs/conventions/general-deterministic.yaml", type: "file" }];
  await expect(
    validateBundledSpecifications({
      ...fixture,
      entries,
      read: async (path) =>
        String(path).endsWith("directives-schema.yaml")
          ? stringify(expectedDirectiveSchema)
          : stringify(convention),
    }),
  ).resolves.toEqual([]);
});

test("uses the bundled root and package namespace", async () => {
  readFile.mockImplementation(async (path) =>
    String(path).endsWith("package.json")
      ? JSON.stringify({ eliware: { id: "E-0" } })
      : stringify(expectedDirectiveSchema),
  );
  readdir.mockResolvedValue([]);
  await expect(validateBundledSpecifications()).resolves.toEqual([]);
});

test("reports invalid schemas and convention documents", async () => {
  const schemaError = await validateBundledSpecifications({
    ...fixture,
    read: async () => "invalid: [",
  });
  expect(schemaError.join(" ")).toContain("Bundled specifications are missing or invalid");

  const boundedError = await validateBundledSpecifications({
    ...fixture,
    read: async () => `value: ${"x".repeat(110)}`,
  });
  expect(boundedError.join(" ")).toContain("Bundled specifications are missing or invalid");

  const documents = [{ path: "specs/conventions/general-deterministic.yaml", type: "file" }];
  const documentError = await validateBundledSpecifications({
    ...fixture,
    entries: documents,
    read: async (path) =>
      String(path).endsWith("directives-schema.yaml")
        ? stringify(expectedDirectiveSchema)
        : [
            stringify(convention),
            stringify({ version: "13.0", description: "No directives." }),
          ].join("\n---\n"),
  });
  expect(documentError.join(" ")).toContain("must be a nonempty array");
});

test("reports specification discovery failures", async () => {
  const errors = await validateBundledSpecifications({
    ...fixture,
    entries: undefined,
    readdir: async () => {
      throw new Error("blocked");
    },
  });
  expect(errors.join(" ")).toContain("Bundled specifications are missing or invalid");
});
