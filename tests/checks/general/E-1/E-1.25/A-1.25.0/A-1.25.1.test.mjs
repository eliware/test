import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../../src/checks/general/E-1/E-1.25/A-1.25.0/A-1.25.1.mjs";

async function fixture(overrides = {}) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-contracts-"));
  await mkdir(join(root, "specs"));
  await mkdir(join(root, "src"));
  await mkdir(join(root, "tests"));
  const contract = {
    schemaVersion: "1.0",
    contractVersion: "8.0",
    kind: "contract-reference",
    description: "fixture",
    authority: {},
    format: {},
    contracts: [
      {
        ...baseContract(),
      },
    ],
    ...overrides,
  };
  await writeFile(join(root, "specs", "contracts.json"), JSON.stringify(contract));
  await writeFile(join(root, "specs", "README.md"), "- [contracts.json](contracts.json)");
  return root;
}

const cleanup = (root) => rm(root, { recursive: true, force: true });

test("passes a complete shared contract record", async () => {
  const root = await fixture();
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.25.1", status: "pass", message: "" });
  await cleanup(root);
});

test("rejects an unindexed contracts file", async () => {
  const root = await fixture();
  await writeFile(join(root, "specs", "README.md"), "# specs");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "specs/README.md must link specs/contracts.json.",
    }),
  );
  await cleanup(root);
});
test("rejects duplicate contract IDs", async () => {
  const root = await fixture();
  const path = join(root, "specs", "contracts.json");
  const contract = JSON.parse(await readFile(path, "utf8"));
  contract.contracts.push({ ...contract.contracts[0] });
  await writeFile(path, JSON.stringify(contract));
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "Contract ID is missing, duplicated, or invalid: C-1.1.",
    }),
  );
  await cleanup(root);
});
test("rejects cyclic contract references", async () => {
  const root = await fixture({
    contracts: [
      {
        ...baseContract(),
        title: "one",
        dependencies: ["C-1.2"],
      },
      {
        ...baseContract(),
        id: "C-1.2",
        title: "two",
        dependencies: ["C-1.1"],
      },
    ],
  });
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "Contract parent and dependency references must resolve without cycles.",
    }),
  );
  await cleanup(root);
});
test("rejects missing implementation and verification evidence targets", async () => {
  const root = await fixture({
    contracts: [
      {
        ...baseContract(),
        implementation: { source: ["src/missing.mjs"] },
        verification: { tests: ["tests/missing.test.mjs"] },
      },
    ],
  });
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("does not resolve"),
    }),
  );
  await cleanup(root);
});

test("rejects malformed contract metadata and missing specification files", async () => {
  const cases = [
    [{ kind: "wrong" }, "shared contract-reference top-level format"],
    [{ contracts: [] }, "must declare at least one contract"],
    [{ contracts: [{}] }, "Every contract must contain the shared required fields"],
    [
      { contracts: [{ ...baseContract(), id: "bad" }] },
      "Contract ID is missing, duplicated, or invalid",
    ],
    [
      {
        contracts: [
          {
            ...baseContract(),
            directiveIds: ["invalid"],
          },
        ],
      },
      "invalid directive references",
    ],
    [
      {
        contracts: [
          {
            ...baseContract(),
            contract: { purpose: "only" },
          },
        ],
      },
      "missing a required behavior section",
    ],
    [{ contracts: [{ ...baseContract(), implementation: null }] }, "implementation evidence must be an object"],
    [{ contracts: [{ ...baseContract(), id: null }] }, "invalid: unknown"],
    [{ contracts: [{ ...baseContract(), contract: null }] }, "missing a required behavior section"],
    [{ contracts: [{ ...baseContract(), dependencies: "C-1.2" }] }, "parent and dependency"],
    [{ contracts: [{ ...baseContract(), verification: { tests: [] } }] }, "nonempty string array"],
    [{ contracts: [{ ...baseContract(), implementation: {} }] }, "must declare implementation source"],
  ];
  for (const [overrides, message] of cases) {
    const root = await fixture(overrides);
    await expect(run({ root })).resolves.toEqual(
      expect.objectContaining({ status: "fail", message: expect.stringContaining(message) }),
    );
    await cleanup(root);
  }
  const missing = await fixture();
  await rm(join(missing, "specs", "contracts.json"));
  await expect(run({ root: missing })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("required") }),
  );
  await cleanup(missing);
});
test("rejects unresolved contract graph references", async () => {
  const root = await fixture({ contracts: [{ ...baseContract(), parent: "C-9.9" }] });
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: "Contract parent and dependency references must resolve without cycles.",
    }),
  );
  await cleanup(root);
});

function baseContract() {
  const sections = Object.fromEntries(
    ["purpose", "inputs", "outputs", "errors", "ordering", "invariants"].map((key) => [key, []]),
  );
  sections.boundaries = {};
  return {
    id: "C-1.1",
    title: "fixture",
    scope: "test",
    directiveIds: ["E-1.25"],
    dos: [],
    donts: [],
    contract: sections,
    implementation: { source: ["src"] },
    verification: { tests: ["tests"] },
  };
}
