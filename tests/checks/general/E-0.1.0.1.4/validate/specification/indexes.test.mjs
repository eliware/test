import { beforeEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const readdir = jest.fn();
const listSpecificationEntries = jest.fn();
const readCanonicalOrder = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, readdir }));
jest.unstable_mockModule(
  "../../../../../../src/checks/general/E-0.1.0.1.4/list-specification-entries.mjs",
  () => ({ listSpecificationEntries }),
);
jest.unstable_mockModule(
  "../../../../../../src/validation/shared/conventions/read-canonical-order.mjs",
  () => ({ readCanonicalOrder }),
);

const { validateSpecificationIndexes } =
  await import("../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/indexes.mjs");

const root = "/repo";
const defaultEntries = [
  { path: "specs/README.md", type: "file" },
  { path: "specs/directives.yaml", type: "file" },
  { path: "specs/nested", type: "directory" },
  { path: "specs/nested/README.md", type: "file" },
  { path: "specs/nested/rules.yaml", type: "file" },
];
const canonicalOrder = {
  directYamlFiles: "filename-ascending",
  subdirectoryIndexes: "directory-name-ascending",
  placement: "after-yaml-files",
};
const validIndexes = [
  "# Specs\n\n- [directives](directives.yaml)\n- [nested](nested/README.md)\n",
  "# Nested\n\n- [rules](rules.yaml)\n",
];

beforeEach(() => {
  readFile.mockReset();
  listSpecificationEntries.mockReset().mockResolvedValue(defaultEntries);
  readCanonicalOrder.mockReset().mockReturnValue(canonicalOrder);
  readFile.mockResolvedValueOnce(validIndexes[0]).mockResolvedValueOnce(validIndexes[1]);
});

test("accepts complete navigation indexes", async () => {
  await expect(validateSpecificationIndexes(root)).resolves.toEqual([]);
  expect(readCanonicalOrder).toHaveBeenCalledWith("specification-indexes.yaml");
});

test("sorts YAML files and child indexes in canonical order", async () => {
  listSpecificationEntries.mockResolvedValueOnce([
    ...defaultEntries,
    { path: "specs/extra.yaml", type: "file" },
    { path: "specs/alpha", type: "directory" },
    { path: "specs/alpha/README.md", type: "file" },
    { path: "specs/alpha/rules.yaml", type: "file" },
  ]);
  readFile
    .mockReset()
    .mockResolvedValueOnce(
      "# Specs\n\n- [directives](directives.yaml)\n- [extra](extra.yaml)\n- [alpha](alpha/README.md)\n- [nested](nested/README.md)\n",
    )
    .mockResolvedValueOnce("# Alpha\n\n- [rules](rules.yaml)\n")
    .mockResolvedValueOnce(validIndexes[1]);
  await expect(validateSpecificationIndexes(root)).resolves.toEqual([]);
});

test("uses supplied index placement and ordering rules", async () => {
  readFile
    .mockReset()
    .mockResolvedValueOnce(
      "# Specs\n\n- [nested](nested/README.md)\n- [directives](directives.yaml)\n",
    )
    .mockResolvedValueOnce(validIndexes[1]);
  await expect(
    validateSpecificationIndexes(root, {
      readOrder: () => ({
        directYamlFiles: "unsorted",
        subdirectoryIndexes: "unsorted",
        placement: "before-yaml-files",
      }),
    }),
  ).resolves.toEqual([]);
});

test("reports missing indexes, invalid links, unsupported files, and missing YAML files", async () => {
  listSpecificationEntries.mockResolvedValueOnce([
    { path: "specs/README.md", type: "file" },
    { path: "specs/extra.txt", type: "file" },
    { path: "specs/link", type: "unsupported" },
    { path: "specs/nested", type: "directory" },
    { path: "specs/nested/README.md", type: "file" },
    { path: "specs/empty", type: "directory" },
  ]);
  readFile
    .mockReset()
    .mockResolvedValueOnce("plain text\n- [extra](extra.txt)\n- [extra](extra.txt)\n")
    .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }))
    .mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
  const errors = (await validateSpecificationIndexes(root)).join("\n");
  expect(errors).toContain("navigation-only");
  expect(errors).toContain("unexpected target");
  expect(errors).toContain("duplicate index links");
  expect(errors).toContain("not an allowed specs file");
  expect(errors).toContain("README.md is required");
  expect(errors).toContain("specs/directives.yaml is required");
  expect(errors).toContain("must contain at least one YAML specification");
  expect(errors).toContain("unsupported filesystem entry");
});

test("reports absent and unreadable specifications directories", async () => {
  listSpecificationEntries.mockRejectedValueOnce(
    Object.assign(new Error("missing"), { code: "ENOENT" }),
  );
  await expect(validateSpecificationIndexes(root)).resolves.toContain(
    "specs/ is required to contain indexed YAML specifications.",
  );
  listSpecificationEntries.mockRejectedValueOnce(new Error("blocked"));
  await expect(validateSpecificationIndexes(root)).resolves.toContain(
    "Specification discovery failed: blocked",
  );
});

test("rejects index links in the wrong order", async () => {
  readFile
    .mockReset()
    .mockResolvedValueOnce(
      "# Specs\n\n- [nested](nested/README.md)\n- [directives](directives.yaml)\n",
    )
    .mockResolvedValueOnce(validIndexes[1]);
  await expect(validateSpecificationIndexes(root)).resolves.toContain(
    "specs/README.md must list index links in the required order.",
  );
});
