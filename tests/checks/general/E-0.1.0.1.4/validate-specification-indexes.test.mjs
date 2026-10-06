import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSpecificationIndexes } from "../../../../src/checks/general/E-0.1.0.1.4/validate-specification-indexes.mjs";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "eliware-index-"));
  await mkdir(join(root, "specs", "nested"), { recursive: true });
  await writeFile(join(root, "specs", "directives.yaml"), "version: 12\n");
  await writeFile(
    join(root, "specs", "README.md"),
    "# Specs\n\n- [directives](directives.yaml)\n- [nested](nested/README.md)\n",
  );
  await writeFile(join(root, "specs", "nested", "rules.yaml"), "version: 12\n");
  await writeFile(
    join(root, "specs", "nested", "README.md"),
    "# Nested\n\n- [rules](rules.yaml)\n",
  );
  return root;
}

test("accepts complete navigation indexes", async () => {
  const root = await fixture();
  try {
    await expect(validateSpecificationIndexes(root)).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects missing directories, files, indexes, and invalid links", async () => {
  await expect(validateSpecificationIndexes("missing")).resolves.toContain(
    "specs/ is required to contain indexed YAML specifications.",
  );
  const root = await fixture();
  try {
    await writeFile(join(root, "specs", "extra.txt"), "extra");
    await writeFile(
      join(root, "specs", "README.md"),
      "plain text\n- [extra](extra.txt)\n- [extra](extra.txt)\n",
    );
    await rm(join(root, "specs", "nested", "README.md"));
    const errors = (await validateSpecificationIndexes(root)).join("\n");
    expect(errors).toContain("navigation-only");
    expect(errors).toContain("unexpected target");
    expect(errors).toContain("duplicate index links");
    expect(errors).toContain("not an allowed specs file");
    expect(errors).toContain("README.md is required");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires a YAML file in every specification directory", async () => {
  const root = await fixture();
  try {
    await rm(join(root, "specs", "directives.yaml"));
    await rm(join(root, "specs", "nested", "rules.yaml"));
    const errors = (await validateSpecificationIndexes(root)).join(" ");
    expect(errors).toContain("specs/directives.yaml is required");
    expect(errors).toContain("specs must contain at least one YAML specification");
    expect(errors).toContain("specs/nested must contain at least one YAML specification");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores entries that are not files or directories", async () => {
  const entries = [{ name: "link", isDirectory: () => false, isFile: () => false }];
  const errors = await validateSpecificationIndexes("/repo", { readdir: async () => entries });
  expect(errors).toContain("specs/directives.yaml is required.");
});
