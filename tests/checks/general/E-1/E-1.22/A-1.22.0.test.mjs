import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.22/A-1.22.0.mjs";

async function fixture(directives) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-directives-"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "directives.json"), JSON.stringify({ directives }));
  return root;
}

test("accepts a valid E-rooted directive tree", async () => {
  const root = await fixture([{ id: "E-18", directives: [{ id: "A-18.1" }] }]);
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.22.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});
test("rejects invalid hierarchy and duplicate IDs", async () => {
  const root = await fixture([
    { id: "A-18" },
    { id: "E-18", directives: [{ id: "E-18.1" }, { id: "E-18.1" }] },
  ]);
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("must be an E-rule"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("maps an unassigned local authority namespace to the directive rule result", async () => {
  const root = await fixture([{ id: "E-18", directives: [{ id: "A-18.1" }] }]);
  await writeFile(
    join(root, "specs", "authority.json"),
    JSON.stringify({
      subjects: [{ directives: [{ ids: ["E-19"] }] }],
    }),
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({
      ruleId: "A-1.22.0",
      status: "fail",
      message: expect.stringContaining("E-18"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects missing, invalid, and empty directive documents", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-directives-"));
  await expect(run({ root: missing })).resolves.toEqual({
    ruleId: "A-1.22.0",
    status: "fail",
    message: "specs/directives.json is required and must be valid JSON.",
  });
  await rm(missing, { recursive: true, force: true });

  const invalid = await mkdtemp(join(tmpdir(), "eliware-test-directives-"));
  await mkdir(join(invalid, "specs"));
  await writeFile(join(invalid, "specs", "directives.json"), "not json");
  await expect(run({ root: invalid })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(invalid, { recursive: true, force: true });

  const empty = await fixture([]);
  await expect(run({ root: empty })).resolves.toEqual({
    ruleId: "A-1.22.0",
    status: "fail",
    message: "specs/directives.json must contain one or more directives.",
  });
  await rm(empty, { recursive: true, force: true });
});
