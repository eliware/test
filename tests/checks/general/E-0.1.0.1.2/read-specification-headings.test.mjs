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

test("reads headings declared in directive requirements", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const nested = join(root, "specs", "profiles");
  await mkdir(nested, { recursive: true });
  try {
    await writeFile(
      join(nested, "profile.yaml"),
      "directives:\n  - dos:\n      - |\n        ## Custom\n        ## Additional\n    examples:\n      - |\n        ## Example only\n",
    );
    await writeFile(join(nested, "README.md"), "## Ignore");
    await expect(readSpecificationHeadings(root)).resolves.toEqual(
      new Set(["Custom", "Additional"]),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("does not treat headings in examples as declarations", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  try {
    await writeFile(
      join(specs, "profile.yaml"),
      "directives:\n  - dos: []\n    examples:\n      - '## Unreleased'\n",
    );
    await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores YAML documents without directive arrays", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  try {
    await writeFile(join(specs, "profile.yaml"), "metadata: true\n");
    await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores YAML null documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  try {
    await writeFile(join(specs, "profile.yaml"), "null\n");
    await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads declared headings from every YAML stream document", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  try {
    await writeFile(
      join(specs, "profile.yaml"),
      "directives:\n  - dos: ['## First']\n---\ndirectives:\n  - dos: ['## Second']\n",
    );
    await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set(["First", "Second"]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports specification read errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  await writeFile(join(specs, "valid.yaml"), "rules: []\n");
  await writeFile(join(specs, "empty.yaml"), "null\n");
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

test("ignores invalid directive fields and rejects malformed YAML", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-spec-headings-"));
  const specs = join(root, "specs");
  await mkdir(specs);
  const path = join(specs, "profile.yaml");
  try {
    await writeFile(path, "directives: null");
    await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
    await writeFile(path, "directives: [null, { dos: [null, invalid] }]");
    await expect(readSpecificationHeadings(root)).resolves.toEqual(new Set());
    await writeFile(path, "directives: [\n");
    await expect(readSpecificationHeadings(root)).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
