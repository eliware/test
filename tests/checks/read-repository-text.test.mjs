import { expect, test } from "@jest/globals";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRepositoryText } from "../../src/checks/read-repository-text.mjs";

test("shares file reads within one validation context and rereads in another", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-text-cache-"));
  const filePath = join(root, "README.md");

  try {
    await writeFile(filePath, "first");
    const context = {};
    const first = readRepositoryText(context, filePath);
    expect(readRepositoryText(context, filePath)).toBe(first);
    await expect(first).resolves.toBe("first");

    await writeFile(filePath, "second");
    await expect(readRepositoryText(context, filePath)).resolves.toBe("first");
    await expect(readRepositoryText({}, filePath)).resolves.toBe("second");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads directly without a validation context", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-text-cache-"));
  const filePath = join(root, "AGENTS.md");

  try {
    await writeFile(filePath, "first");
    await expect(readRepositoryText(null, filePath)).resolves.toBe(await readFile(filePath, "utf8"));
    await writeFile(filePath, "second");
    await expect(readRepositoryText(null, filePath)).resolves.toBe("second");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
