import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { validateLocalStructuredReference } from "../../../../src/checks/documentation/E-0.1.100/validate-local-structured-reference.mjs";

test("accepts existing local targets and reports missing ones", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-local-structured-reference-"));
  const target = join(root, "target.json");
  await writeFile(target, "{}");
  await expect(validateLocalStructuredReference(target)).resolves.toBeUndefined();
  await expect(validateLocalStructuredReference(join(root, "missing.json"))).rejects.toThrow();
  await rm(root, { recursive: true, force: true });
});
