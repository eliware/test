import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/web/E-1.50/A-1.50.0.mjs";

test("requires a web AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-web-agents-"));
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await writeFile(
    join(root, "AGENTS.md"),
    "web routes assets configuration browser deployment port",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
});
