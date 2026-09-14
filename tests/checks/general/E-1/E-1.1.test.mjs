import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.1.mjs";

test("requires a README with a non-empty Purpose section", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-parent-"));
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ ruleId: "E-1.1", status: "fail" }),
  );
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Purpose\nA test repository.\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.1", status: "pass", message: "" });
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Purpose\n\n## Usage\nrun it\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Usage\nrun it\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Purpose\nA test repository.\n\n## Usage\nrun it\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.1", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});
