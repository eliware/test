import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.25/A-0.1.25.0.mjs";

async function createSpecsRoot() {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-"));
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(join(root, "specs", "directives.yaml"), "{}\n");
  await writeFile(join(root, "specs", "README.md"), "# Specs\n\n- [Directives](directives.yaml)\n");
  return root;
}

test("accepts indexed root YAML specifications", async () => {
  const root = await createSpecsRoot();
  await writeFile(join(root, "specs", "schema.yaml"), "{}\n");
  await writeFile(
    join(root, "specs", "README.md"),
    "# Specs\n\n- [Directives](directives.yaml)\n- [Schema](schema.yaml)\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("accepts nested specs folders with local indexes linked from their parent", async () => {
  const root = await createSpecsRoot();
  await mkdir(join(root, "specs", "conventions", "nested"), { recursive: true });
  await writeFile(join(root, "specs", "conventions", "general.yaml"), "{}\n");
  await writeFile(join(root, "specs", "conventions", "nested", "profile.yaml"), "{}\n");
  await writeFile(
    join(root, "specs", "README.md"),
    "# Specs\n\n- [Directives](directives.yaml)\n- [Conventions](conventions/README.md)\n",
  );
  await writeFile(
    join(root, "specs", "conventions", "README.md"),
    "# Conventions\n\n- [General](general.yaml)\n- [Nested](nested/README.md)\n",
  );
  await writeFile(
    join(root, "specs", "conventions", "nested", "README.md"),
    "# Nested\n\n- [Profile](profile.yaml)\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("uses the shared repository inventory when available", async () => {
  const root = await createSpecsRoot();
  const repositoryInventory = {
    entriesUnder: async () => [{ path: "specs/directives.yaml", type: "file" }],
  };
  await expect(run({ root, repositoryInventory })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("requires indexes in every specs subfolder and parent links to child indexes", async () => {
  const root = await createSpecsRoot();
  await mkdir(join(root, "specs", "conventions"));
  await writeFile(join(root, "specs", "conventions", "general.yaml"), "{}\n");
  await writeFile(join(root, "specs", "README.md"), "# Specs\n\n- [Directives](directives.yaml)\n");
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("specs/README.md must link conventions/README.md.");
  expect(result.message).toContain("specs/conventions/README.md is required");
  await rm(root, { recursive: true, force: true });
});

test("requires YAML specifications in every indexed subfolder", async () => {
  const root = await createSpecsRoot();
  await mkdir(join(root, "specs", "empty"));
  await writeFile(join(root, "specs", "empty", "README.md"), "# Empty\n");
  await writeFile(
    join(root, "specs", "README.md"),
    "# Specs\n\n- [Directives](directives.yaml)\n- [Empty](empty/README.md)\n",
  );
  const result = await run({ root });
  expect(result.message).toContain("specs/empty must contain at least one YAML specification.");
  await rm(root, { recursive: true, force: true });
});

test("rejects unindexed local YAML, extra index targets, and prose in indexes", async () => {
  const root = await createSpecsRoot();
  await writeFile(join(root, "specs", "extra.yaml"), "{}\n");
  await writeFile(
    join(root, "specs", "README.md"),
    "This is prose.\n\n- [Directives](directives.yaml)\n- [Unknown](unknown.yaml)\n",
  );
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("specs/README.md must link extra.yaml.");
  expect(result.message).toContain("unexpected target unknown.yaml");
  expect(result.message).toContain("navigation-only index");
  await rm(root, { recursive: true, force: true });
});

test("rejects non-YAML files and missing directives specification", async () => {
  const root = await createSpecsRoot();
  await rm(join(root, "specs", "directives.yaml"));
  await writeFile(join(root, "specs", "data.json"), "{}\n");
  await writeFile(join(root, "specs", "README.md"), "# Specs\n");
  const result = await run({ root });
  expect(result.status).toBe("fail");
  expect(result.message).toContain("specs/directives.yaml is required");
  expect(result.message).toContain("data.json is not an allowed specs file");
  await rm(root, { recursive: true, force: true });
});

test("reports a missing specs directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-missing-"));
  const result = await run({ root });
  expect(result.message).toContain("specs/ is required");
  await rm(root, { recursive: true, force: true });
});
