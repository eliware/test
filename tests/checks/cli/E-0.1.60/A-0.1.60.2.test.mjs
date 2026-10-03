import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/cli/E-0.1.60/A-0.1.60.2.mjs";

test("requires the documented CLI contract in README.md", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "A-0.1.60.2",
    status: "pass",
    message: "",
  });
});

test("fails when the CLI README is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-readme-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-0.1.60.2",
    status: "fail",
    message: "README.md must document the CLI contract.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when a required CLI README section is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-readme-incomplete-"));
  await writeFile(join(root, "README.md"), "Purpose\n");
  const result = await run({ root });
  expect(result.status).toBe("fail");
  for (const term of [
    "## Commands",
    "## Exit codes",
    "--help",
    "--version",
    "supported platforms",
    "validation evidence",
  ])
    expect(result.message).toContain(`CLI README.md must document ${term}.`);
  await rm(root, { recursive: true, force: true });
});

test("requires platform support and validation to be distinguished", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-platform-evidence-"));
  const readme = `## Commands\n--help --version\n## Exit codes\nSupported platforms: Windows, macOS, and Linux.\n`;
  await writeFile(join(root, "README.md"), readme);
  const result = await run({ root });
  expect(result).toEqual({
    ruleId: "A-0.1.60.2",
    status: "fail",
    message: "CLI README.md must document validation evidence.",
  });
  await rm(root, { recursive: true, force: true });
});
