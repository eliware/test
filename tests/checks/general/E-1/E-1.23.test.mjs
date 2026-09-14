import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/general/E-1/E-1.23.mjs";

test("requires the Eliware MIT license attribution", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-license-"));
  await writeFile(join(root, "LICENSE"), "MIT License\nCopyright (c) 2026 Eliware\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.23", status: "pass", message: "" });
  await writeFile(join(root, "LICENSE"), "Apache License\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "LICENSE"), "MIT License\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, "LICENSE"), "Copyright (c) 2026 Eliware\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});

test("fails when the root license is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-license-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.23",
    status: "fail",
    message: "LICENSE is required at the repository root.",
  });
  await rm(root, { recursive: true, force: true });
});
