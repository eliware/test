import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/cli/E-1.60/A-1.60.0.mjs";

test("requires CLI guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-"));
  await writeFile(
    join(root, "AGENTS.md"),
    `## CLI
Executable entrypoint; argument parsing, defaults, validation and errors; exit code mapping; supported platform behavior; --help and --version; dry-run safeguard.
`,
  );
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "AGENTS.md"), "## CLI\nCLI requirements\n");
  expect((await run({ root })).status).toBe("fail");
  await writeFile(
    join(root, "AGENTS.md"),
    "## Project\nCLI requirements are discussed here instead.\n",
  );
  expect((await run({ root })).status).toBe("fail");
});

test("fails when CLI AGENTS guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-missing-"));
  expect((await run({ root })).status).toBe("fail");
});
