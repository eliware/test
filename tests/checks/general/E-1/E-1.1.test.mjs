import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.1.mjs";

test("requires non-empty Features and Usage sections without requiring a Purpose heading", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-parent-"));
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ ruleId: "E-1.1", status: "fail" }),
  );
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Features\nA test repository.\n\n## Usage\nRun its tests.\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.1", status: "pass", message: "" });
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Features\nA test repository.\n\n## Usage\n\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Usage\nRun its tests.\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "README.md"), "# Fixture\n\n## Features\nA test repository.\n\n## Usage\nRun its tests.\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.1", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});
