import { expect, test } from "@jest/globals";
import { createGhcrInventory, ghcrWorkflow } from "../../../../../test-fixtures/ghcr-workflow.mjs";
import { validateGhcrPublishWorkflow } from "../../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr/publish-workflow.mjs";

test("accepts the canonical GHCR workflow byte for byte", async () => {
  await expect(validateGhcrPublishWorkflow(createGhcrInventory())).resolves.toEqual([]);
});

test.each([
  ["one changed byte", `${ghcrWorkflow} `],
  ["different line endings", ghcrWorkflow.replaceAll("\n", "\r\n")],
  ["a missing final newline", ghcrWorkflow.trimEnd()],
])("rejects a GHCR workflow with %s", async (_name, workflow) => {
  await expect(validateGhcrPublishWorkflow(createGhcrInventory({ workflow }))).resolves.toEqual([
    ".github/workflows/ghcr.yaml must match the bundled Eliware Test file specs/workflows/ghcr.yaml byte for byte.",
  ]);
});

test.each([
  ["actions/attest", "      - uses: actions/attest@v4\n      - run: echo"],
  ["gh attestation verify", "      - run: gh attestation verify\n      - run: echo"],
])("rejects a GHCR workflow that restores %s", async (_name, steps) => {
  const workflow = ghcrWorkflow.replace("      - run: echo", steps);
  await expect(validateGhcrPublishWorkflow(createGhcrInventory({ workflow }))).resolves.toEqual([
    ".github/workflows/ghcr.yaml must match the bundled Eliware Test file specs/workflows/ghcr.yaml byte for byte.",
  ]);
});

test("requires the root Dockerfile and canonical workflow name", async () => {
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ files: ["AGENTS.md"] })),
  ).resolves.toEqual(["Repository root must contain Dockerfile."]);
  await expect(
    validateGhcrPublishWorkflow(
      createGhcrInventory({ files: ["Dockerfile", ".github/workflows/publish.yaml"] }),
    ),
  ).resolves.toEqual([".github/workflows/ghcr.yaml is required."]);
});

test("reports inventory errors", async () => {
  await expect(validateGhcrPublishWorkflow({})).resolves.toEqual([
    "Repository files could not be inspected.",
  ]);
  await expect(
    validateGhcrPublishWorkflow({
      files: async () => {
        throw new Error("offline");
      },
    }),
  ).resolves.toEqual(["Repository files could not be inspected: offline"]);
});
