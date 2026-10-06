import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readSpecificationHeadings } from "../../../../src/checks/general/E-0.1.0.1.2/read-specification-headings.mjs";

test("returns no headings when specs are absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  try {
    await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads declared headings from nested YAML specification values", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const nested = join(root, "specs", "profiles");
  await mkdir(nested, { recursive: true });
  try {
    await writeFile(
      join(nested, "profile.yaml"),
      "rules:\n  - text: |\n      ## Custom\n      ## Additional\n",
    );
    await writeFile(join(nested, "README.md"), "## Ignore");
    await expect(readSpecificationHeadings(root)).resolves.toEqual(
      new Set(["Custom", "Additional"]),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports specification read errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  await writeFile(join(specs, "valid.yaml"), "rules: []\n");
  try {
    await expect(
      readSpecificationHeadings(root, {
        read: async () => {
          throw new Error("blocked");
        },
      }),
    ).rejects.toThrow("blocked");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports errors when the specifications path is not a directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  await writeFile(join(root, "specs"), "not a directory");
  try {
    await expect(readSpecificationHeadings(root)).rejects.toMatchObject({ code: "ENOTDIR" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
