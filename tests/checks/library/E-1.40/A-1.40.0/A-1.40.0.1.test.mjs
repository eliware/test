import { expect, test } from "@jest/globals";
import { writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/library/E-1.40/A-1.40.0/A-1.40.0.1.mjs";

test("requires library contract topics in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-library-topics-"));
  await writeFile(
    join(root, "AGENTS.md"),
    "api exports declarations compatibility packaging consumer",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await writeFile(join(root, "AGENTS.md"), "api");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});

test("reports a missing AGENTS file", async () => {
  await expect(run({ root: "C:\\missing-library-repository" })).resolves.toEqual({
    ruleId: "A-1.40.0.1",
    status: "fail",
    message: "AGENTS.md is required before library requirements can be reviewed.",
  });
});
