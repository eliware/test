import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { inspectLibraryExamples } from "../../../../src/checks/library/E-1.40/inspect-library-examples.mjs";

async function createSurface(indexText, example = true) {
  const root = await mkdtemp(join(tmpdir(), "eliware-library-surface-"));
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await writeFile(join(root, "examples", "README.md"), indexText);
  if (example) await writeFile(join(root, "examples", "basic.mjs"), "export {};\n");
  return root;
}

const validIndex = "Purpose\nPrerequisites\nCommand\nExpected result\n[basic.mjs](basic.mjs)";

test("discovers runnable example files after validating the documentation index", async () => {
  const root = await createSurface(validIndex);
  try {
    await expect(inspectLibraryExamples(root)).resolves.toEqual({
      examples: [expect.objectContaining({ name: "basic.mjs" })],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports missing runnable examples and invalid index content", async () => {
  const noExample = await createSurface("examples", false);
  try {
    await expect(inspectLibraryExamples(noExample)).resolves.toEqual({
      error: "Libraries must provide at least one runnable example.",
    });
  } finally {
    await rm(noExample, { recursive: true, force: true });
  }
  const invalidIndex = await createSurface("invalid");
  try {
    await expect(inspectLibraryExamples(invalidIndex)).resolves.toEqual({
      error: expect.stringContaining("examples/README.md"),
    });
  } finally {
    await rm(invalidIndex, { recursive: true, force: true });
  }
});
