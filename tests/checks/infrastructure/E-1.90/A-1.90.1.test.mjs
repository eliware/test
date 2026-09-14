import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/infrastructure/E-1.90/A-1.90.1.mjs";

test("requires infrastructure README topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-infra-readme-"));
  await writeFile(
    join(root, "README.md"),
    "purpose managed targets requirements setup configuration desired state validation change boundaries security support license",
  );
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.90.1", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports missing README topics and files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-infra-readme-"));
  await writeFile(join(root, "README.md"), "purpose managed targets requirements");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.90.1",
    status: "fail",
    message:
      "Infrastructure README.md is missing: setup, configuration, desired state, validation, change boundaries, security, support, license.",
  });
  await rm(root, { recursive: true, force: true });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.90.1",
    status: "fail",
    message: "Infrastructure repositories require a root README.md file.",
  });
});
