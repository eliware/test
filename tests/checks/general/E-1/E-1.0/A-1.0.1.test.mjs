import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.0/A-1.0.1.mjs";

test("requires scope and boundary guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-agents-"));
  await writeFile(join(root, "AGENTS.md"), "Repository scope and important boundaries.");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await writeFile(join(root, "AGENTS.md"), "Repository scope.");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});
