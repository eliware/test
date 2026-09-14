import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.26/A-1.26.0.mjs";

test("requires current release notes and README indexing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-release-notes-"));
  await writeFile(join(root, "README.md"), "[Release notes](RELEASE_NOTES.md)");
  await writeFile(join(root, "RELEASE_NOTES.md"), "# Release notes\n\n## 8.0.0\n");
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toEqual({
    ruleId: "A-1.26.0",
    status: "pass",
    message: "",
  });
  await writeFile(join(root, "README.md"), "# README");
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await writeFile(join(root, "README.md"), "[Release notes](RELEASE_NOTES.md)");
  await writeFile(join(root, "RELEASE_NOTES.md"), "# Release notes\n\n## 7.0.0\n");
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await expect(run({ root, packageJson: {} })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(join(root, "RELEASE_NOTES.md"));
  await expect(run({ root, packageJson: { version: "8.0.0" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await rm(root, { recursive: true, force: true });
});
