import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateContractReferences } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/validate-contract-references.mjs";

test("validates implementation and verification evidence targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-contract-evidence-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  await mkdir(join(root, "bin"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "src", "index.mjs"), "export {};");
  await writeFile(join(root, "bin", "cli.mjs"), "export {};");
  await writeFile(join(root, "specs", "README.md"), "# specs");
  await writeFile(join(root, "tests", "index.test.mjs"), "export {};");
  const file = join(root, "specs", "contracts.json");
  const contract = {
    id: "C-1.1",
    implementation: { source: ["src"] },
    verification: { tests: ["tests"] },
  };
  await expect(validateContractReferences({ root, file, contract })).resolves.toBeNull();
});

test("rejects malformed and unresolved evidence targets", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-contract-evidence-invalid-"));
  const file = join(root, "specs", "contracts.json");
  const malformed = {
    id: "C-1.1",
    implementation: { source: ["src/missing.mjs"] },
    verification: { tests: ["tests/missing.test.mjs"] },
  };
  await expect(validateContractReferences({ root, file, contract: malformed })).resolves.toContain(
    "does not resolve",
  );
});

test("accepts optional evidence fields and all approved source roots", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-contract-evidence-roots-"));
  for (const directory of ["src", "bin", "specs", "tests"]) await mkdir(join(root, directory));
  await writeFile(join(root, "src", "index.mjs"), "export {};");
  await writeFile(join(root, "bin", "cli.mjs"), "export {};");
  await writeFile(join(root, "specs", "README.md"), "# specs");
  await writeFile(join(root, "tests", "index.test.mjs"), "export {};");
  const file = join(root, "specs", "contracts.json");
  const contract = {
    id: "C-1.2",
    implementation: { source: ["./src/index.mjs", "bin/cli.mjs", "specs/README.md"] },
    verification: { tests: ["./tests/index.test.mjs"] },
  };
  await expect(validateContractReferences({ root, file, contract })).resolves.toBeNull();
  await expect(
    validateContractReferences({
      root,
      file,
      contract: { id: "C-1.3", implementation: {}, verification: {} },
    }),
  ).resolves.toBeNull();
});

test("rejects missing evidence, non-string paths, and paths outside approved trees", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-contract-evidence-shapes-"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  const file = join(root, "specs", "contracts.json");
  const base = { id: "C-1.4", implementation: { source: ["src"] }, verification: { tests: ["tests"] } };
  await expect(validateContractReferences({ root, file, contract: { ...base, implementation: null } })).resolves.toContain("implementation evidence must be an object");
  await expect(validateContractReferences({ root, file, contract: { ...base, verification: [] } })).resolves.toContain("verification evidence must be an object");
  await expect(validateContractReferences({ root, file, contract: { ...base, implementation: { source: [7] } } })).resolves.toContain("must be an array of paths");
  await expect(validateContractReferences({ root, file, contract: { ...base, implementation: { source: ["docs/guide.md"] } } })).resolves.toContain("must point into the src/, bin/, or specs/ tree");
  await expect(validateContractReferences({ root, file, contract: { ...base, verification: { tests: ["src/index.mjs"] } } })).resolves.toContain("must point into the tests/ tree");
});
