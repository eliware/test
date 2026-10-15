import { expect, test } from "@jest/globals";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir as readDirectory,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSpecificationDirectives } from "../../../../../../src/checks/general/E-0.1.0.1.4/validate/specification/directives.mjs";
import { conventionVersion } from "../../../../../helpers/project-version.mjs";

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-"));
  const specs = join(root, "specs");
  await mkdir(specs, { recursive: true });
  await writeFile(
    join(specs, "directives.yaml"),
    `version: '${conventionVersion}'\ndescription: Harness\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n    children:\n      - id: E-0.0.0\n        dos: [Do]\n        donts: [Do not]\n`,
  );
  return root;
}

test("uses the bundled schema and validates consumer directive documents", async () => {
  const root = await createFixture();
  try {
    await expect(
      validateSpecificationDirectives(root, { eliware: { id: "E-0" } }),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses default package metadata and reports the missing namespace", async () => {
  const root = await createFixture();
  try {
    expect(await validateSpecificationDirectives(root)).toContain(
      "package.json.eliware.id must define the assigned E-number.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parses every consumer document in a YAML stream", async () => {
  const root = await createFixture();
  try {
    const harness = join(root, "specs", "directives.yaml");
    await writeFile(
      harness,
      `${await readFile(harness, "utf8")}\n---\nversion: '${conventionVersion}'\ndescription: Second harness document\ndirectives:\n  - id: E-0.1\n    dos: [Do]\n    donts: [Do not]\n`,
    );
    await expect(
      validateSpecificationDirectives(root, { eliware: { id: "E-0" } }),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports schema, namespace, and file errors", async () => {
  const root = await createFixture();
  try {
    const errors = await validateSpecificationDirectives(
      root,
      {},
      {
        read: async (path, encoding) =>
          String(path).endsWith("specs/directives-schema.yaml") ? "{}" : readFile(path, encoding),
      },
    );
    expect(errors.join(" ")).toContain("document and directive schema");
    expect(errors.join(" ")).toContain("assigned E-number");
    await rm(join(root, "specs", "directives.yaml"));
    expect(
      (await validateSpecificationDirectives(root, { eliware: { id: "E-0" } })).join(" "),
    ).toContain("specs/directives.yaml is required");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("validates nested specification files and does not require a consumer schema copy", async () => {
  const root = await createFixture();
  try {
    const nested = join(root, "specs", "nested", "deep");
    await mkdir(nested, { recursive: true });
    await writeFile(
      join(nested, "extra.yaml"),
      `version: '${conventionVersion}'\ndescription: Extra rules\ndirectives:\n  - id: E-0.1\n    dos: [Do]\n    donts: [Do not]\n`,
    );
    await expect(
      validateSpecificationDirectives(root, { eliware: { id: "E-0" } }),
    ).resolves.toEqual([]);
    await writeFile(
      join(nested, "extra.yaml"),
      `version: '${conventionVersion}'\ndescription: Extra rules\nunknown: true\ndirectives:\n  - id: E-0.1\n    dos: [Do]\n    donts: [Do not]\n`,
    );
    expect(
      (await validateSpecificationDirectives(root, { eliware: { id: "E-0" } })).join(" "),
    ).toContain("contains unsupported document fields");
    await writeFile(
      join(nested, "extra.yaml"),
      `version: '${conventionVersion}'\ndescription: Duplicate rule\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n`,
    );
    expect(
      (await validateSpecificationDirectives(root, { eliware: { id: "E-0" } })).join(" "),
    ).toContain("Duplicate specification rule ID: E-0.0");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports malformed bundled schema YAML and invalid directive data", async () => {
  const root = await createFixture();
  try {
    const schemaError = await validateSpecificationDirectives(
      root,
      { eliware: { id: "E-0" } },
      {
        read: async (path, encoding) =>
          String(path).endsWith("specs/directives-schema.yaml")
            ? "directives: [\n"
            : readFile(path, encoding),
      },
    );
    expect(schemaError.join(" ")).toContain("Bundled specifications are missing or invalid");
    await writeFile(join(root, "specs", "directives.yaml"), "directives: [\n");
    await expect(
      validateSpecificationDirectives(root, { eliware: { id: "E-0" } }),
    ).resolves.toEqual(
      expect.arrayContaining([expect.stringContaining("specs/directives.yaml is invalid YAML")]),
    );
    await writeFile(
      join(root, "specs", "directives.yaml"),
      `version: '${conventionVersion}'\ndescription: Invalid\ndirectives: null\n`,
    );
    expect(
      (await validateSpecificationDirectives(root, { eliware: { id: "E-0" } })).join(" "),
    ).toContain("directives must be a nonempty array");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("keeps bundled validation results when consumer discovery fails", async () => {
  const root = await createFixture();
  try {
    const errors = await validateSpecificationDirectives(
      root,
      { eliware: { id: "E-0" } },
      {
        readdir: async (path, options) => {
          if (String(path) === join(root, "specs")) throw new Error("consumer specs unavailable");
          return readDirectory(path, options);
        },
      },
    );
    expect(errors).toEqual(["Consumer specification discovery failed: consumer specs unavailable"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
