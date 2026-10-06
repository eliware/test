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
