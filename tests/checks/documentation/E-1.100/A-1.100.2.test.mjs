import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/documentation/E-1.100/A-1.100.2.mjs";

test("requires documentation README topics and surface link", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-readme-"));
  await writeFile(
    join(root, "README.md"),
    "scope authority navigation contribution validation security support license docs/",
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.2",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when the documentation README is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-readme-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.2",
    status: "fail",
    message: "Documentation repositories require a root README.md file.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports missing documentation README topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-readme-topics-"));
  await writeFile(join(root, "README.md"), "scope");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.2",
    status: "fail",
    message:
      "Documentation README.md is missing: authority, navigation, contribution, validation, security, support, license.",
  });
  await rm(root, { recursive: true, force: true });
});

test("requires a documentation surface link", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-readme-link-"));
  await writeFile(
    join(root, "README.md"),
    "scope authority navigation contribution validation security support license",
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.2",
    status: "fail",
    message: "Documentation README.md must link the documentation surface.",
  });
  await rm(root, { recursive: true, force: true });
});
