import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateConsumerSpecifications } from "../../../../../src/checks/general/E-0.1.0.1.4/validate/consumer-specifications.mjs";
import { conventionVersion } from "../../../../helpers/project-version.mjs";

async function createRoot() {
  const root = await mkdtemp(join(tmpdir(), "eliware-consumer-specs-"));
  const specs = join(root, "specs");
  await mkdir(specs, { recursive: true });
  await writeFile(
    join(specs, "directives.yaml"),
    `version: '${conventionVersion}'\ndescription: Rules\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n`,
  );
  return { root, specs };
}

test("parses every YAML file and validates directive documents recursively", async () => {
  const { root, specs } = await createRoot();
  const nested = join(specs, "nested", "deep");
  await mkdir(nested, { recursive: true });
  try {
    await writeFile(
      join(specs, "custom-schema.yaml"),
      "type: object\nproperties: {name: {type: string}}\n",
    );
    await writeFile(
      join(nested, "extra.yml"),
      `version: '${conventionVersion}'\ndescription: Extra\ndirectives:\n  - id: E-0.1\n    dos: [Do]\n    donts: [Do not]\n`,
    );
    await expect(validateConsumerSpecifications(root, "E-0")).resolves.toEqual([]);
    await writeFile(join(specs, "custom-schema.yaml"), "type: [\n");
    expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
      "custom-schema.yaml is invalid YAML",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects duplicate IDs across directive files", async () => {
  const { root, specs } = await createRoot();
  try {
    await mkdir(join(specs, "nested"), { recursive: true });
    await writeFile(
      join(specs, "nested", "extra.yaml"),
      `version: '${conventionVersion}'\ndescription: Duplicate\ndirectives:\n  - id: E-0.0\n    dos: [Do]\n    donts: [Do not]\n`,
    );
    expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
      "Duplicate specification rule ID: E-0.0",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires the root directive file and reports invalid YAML", async () => {
  const { root, specs } = await createRoot();
  try {
    await rm(join(specs, "directives.yaml"));
    expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
      "specs/directives.yaml is required",
    );
    await writeFile(
      join(specs, "directives.yaml"),
      `version: '${conventionVersion}'\ndescription: No rules\n`,
    );
    expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
      "specs/directives.yaml must contain a directive document",
    );
    await writeFile(
      join(specs, "directives.yaml"),
      `version: '${conventionVersion}'\ndescription: Invalid\ndirectives: null\n`,
    );
    expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
      "directives must be a nonempty array",
    );
    await writeFile(join(specs, "directives.yaml"), "directives: [\n");
    expect((await validateConsumerSpecifications(root, "E-0")).join(" ")).toContain(
      "directives.yaml is invalid YAML",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports specification discovery failures", async () => {
  await expect(
    validateConsumerSpecifications("/missing", "E-0", {
      readdir: async () => {
        throw new Error("blocked");
      },
    }),
  ).resolves.toEqual(["Consumer specification discovery failed: blocked"]);
});

test("requires a valid assigned rule namespace", async () => {
  const { root } = await createRoot();
  try {
    expect((await validateConsumerSpecifications(root, "invalid")).join(" ")).toContain(
      "package.json.eliware.id must define the assigned E-number.",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports unreadable specification files", async () => {
  const { root } = await createRoot();
  try {
    await expect(
      validateConsumerSpecifications(root, "E-0", {
        read: async () => {
          throw new Error("blocked");
        },
      }),
    ).resolves.toEqual(["specs/directives.yaml could not be read: blocked"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports parser exceptions for a specification file", async () => {
  const { root } = await createRoot();
  try {
    await expect(
      validateConsumerSpecifications(root, "E-0", { read: async () => ({}) }),
    ).resolves.toEqual(["specs/directives.yaml is invalid YAML: source is not a string"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
