import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.0.mjs";

test("requires GHCR publication guidance in AGENTS.md", async () => {
  const { root } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
});

test("reports missing GHCR topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ghcr-topics-"));
  await writeFile(join(root, "AGENTS.md"), "ghcr image");
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("visibility, publication, workflow, provenance, deployment"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("fails when AGENTS.md is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ghcr-topics-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.160.0",
    status: "fail",
    message: "GHCR repositories require a root AGENTS.md file.",
  });
  await rm(root, { recursive: true, force: true });
});
