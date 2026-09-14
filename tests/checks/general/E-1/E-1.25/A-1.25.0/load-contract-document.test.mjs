import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { loadContractDocument } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/load-contract-document.mjs";

test("loads contracts and the specs index together", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-contract-load-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "contracts.json"), JSON.stringify({ kind: "contract-reference" }));
  await writeFile(join(root, "specs", "README.md"), "contracts.json");
  await expect(loadContractDocument(root)).resolves.toEqual({
    contracts: { kind: "contract-reference" },
    index: "contracts.json",
    error: null,
  });
  await rm(root, { recursive: true, force: true });
});

test("returns a readable-file error when either document is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-contract-load-"));
  await expect(loadContractDocument(root)).resolves.toEqual({
    contracts: null,
    index: null,
    error: "specs/contracts.json and specs/README.md are required and must be readable.",
  });
  await rm(root, { recursive: true, force: true });
});
