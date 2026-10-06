import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateSpecificationDirectives } from "../../../../src/checks/general/E-0.1.0.1.4/validate-specification-directives.mjs";

async function createFixture() {
  const root = await mkdtemp(join(tmpdir(), "eliware-directives-"));
  const specs = join(root, "specs");
  await mkdir(join(specs, "conventions", "nested"), { recursive: true });
  const schema = await readFile(join(process.cwd(), "specs", "directives-schema.yaml"), "utf8");
  await writeFile(join(specs, "directives-schema.yaml"), schema);
  await writeFile(
    join(specs, "directives.yaml"),
    "version: '12.0'\ndescription: Harness\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n    children:\n      - id: E-0.0.0\n        dos: [Do]\n        donts: [Do not]\n",
  );
  const convention =
    "version: '12.0'\ndescription: General rules\nrequires: []\ndirectives:\n  - id: E-0.1.0\n    dos: [Do]\n    donts: [Do not]\n";
  await writeFile(join(specs, "conventions", "general.yaml"), convention);
  await writeFile(
    join(specs, "conventions", "nested", "extra.yml"),
    convention.replace("E-0.1.0", "E-0.2.0"),
  );
  return root;
}

test("validates the schema and nested directive documents", async () => {
  const root = await createFixture();
  try {
    await expect(
      validateSpecificationDirectives(root, { eliware: { id: "E-0" } }),
    ).resolves.toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("parses every document in a YAML stream", async () => {
  const root = await createFixture();
  try {
    const harness = join(root, "specs", "directives.yaml");
    await writeFile(
      harness,
      `${await readFile(harness, "utf8")}\n---\nversion: '12.0'\ndescription: Second harness document\ndirectives:\n  - id: E-0.1\n    dos: [Do]\n    donts: [Do not]\n`,
    );
    const general = join(root, "specs", "conventions", "general.yaml");
    await writeFile(
      general,
      `${await readFile(general, "utf8")}\n---\nversion: '12.0'\ndescription: Second profile document\nrequires: []\ndirectives:\n  - id: E-0.1.1\n    dos: [Do]\n    donts: [Do not]\n`,
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
          path.endsWith("directives-schema.yaml") ? "{}" : readFile(path, encoding),
      },
    );
    expect(errors.join(" ")).toContain("v12 document and directive schema");
    expect(errors.join(" ")).toContain("assigned E-number");
    await rm(join(root, "specs", "conventions"), { recursive: true, force: true });
    expect(
      (await validateSpecificationDirectives(root, { eliware: { id: "E-0" } })).join(" "),
    ).toContain("Specification YAML could not be read");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports a convention YAML read error", async () => {
  const root = await createFixture();
  try {
    const errors = await validateSpecificationDirectives(
      root,
      { eliware: { id: "E-0" } },
      {
        read: async (path, encoding) => {
          if (path.endsWith("general.yaml")) throw new Error("blocked");
          return readFile(path, encoding);
        },
      },
    );
    expect(errors.join(" ")).toContain("Specification YAML could not be read");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects duplicate, unknown, and self-referential profile prerequisites", async () => {
  const root = await createFixture();
  try {
    await writeFile(
      join(root, "specs", "conventions", "custom-deterministic.yaml"),
      "version: '12.0'\ndescription: Custom rules\nrequires: [custom, missing, missing]\ndirectives:\n  - id: E-0.3.0\n    dos: [Do]\n    donts: [Do not]\n",
    );
    const errors = await validateSpecificationDirectives(root, { eliware: { id: "E-0" } });
    expect(errors).toContain(
      "specs/conventions/custom-deterministic.yaml document 1.requires must not contain duplicate profiles.",
    );
    expect(errors).toContain(
      "specs/conventions/custom-deterministic.yaml document 1.requires must not include its own profile.",
    );
    expect(errors).toContain(
      "specs/conventions/custom-deterministic.yaml document 1.requires names unknown profiles: missing, missing.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ignores non-array requirements and unrelated convention file names", async () => {
  const root = await createFixture();
  try {
    await writeFile(
      join(root, "specs", "conventions", "general-deterministic.yaml"),
      "version: '12.0'\ndescription: General\nrequires: none\ndirectives: []\n",
    );
    await writeFile(
      join(root, "specs", "conventions", "extra.yaml"),
      "version: '12.0'\ndescription: Extra rules\ndirectives:\n  - id: E-0.4.0\n    dos: [Do]\n    donts: [Do not]\n",
    );
    expect(await validateSpecificationDirectives(root, { eliware: { id: "E-0" } })).toContain(
      "specs/conventions/general-deterministic.yaml document 1.requires must list valid profile names.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports malformed schema YAML and non-array directive data", async () => {
  const root = await createFixture();
  try {
    await writeFile(
      join(root, "specs", "conventions", "general-deterministic.yaml"),
      "version: '12.0'\ndescription: General\nrequires: []\ndirectives: null\n",
    );
    const invalid = await validateSpecificationDirectives(root, { eliware: { id: "E-0" } });
    expect(invalid.join(" ")).toContain("directives");
    await writeFile(join(root, "specs", "directives-schema.yaml"), "directives: [\n");
    await expect(
      validateSpecificationDirectives(root, { eliware: { id: "E-0" } }),
    ).resolves.toEqual(
      expect.arrayContaining([expect.stringContaining("Directive schema or document is missing")]),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
