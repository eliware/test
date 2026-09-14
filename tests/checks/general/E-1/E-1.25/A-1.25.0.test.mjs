import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.25/A-1.25.0.mjs";

test("requires indexed specification records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-specs-"));
  await mkdir(join(root, "specs"));
  for (const file of ["authority.json", "directives.json", "contracts.json"])
    await writeFile(join(root, "specs", file), "{}");
  await writeFile(
    join(root, "specs", "README.md"),
    "authority.json directives.json contracts.json",
  );
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "specs", "README.md"), "authority.json");
  expect((await run({ root })).status).toBe("fail");
});
