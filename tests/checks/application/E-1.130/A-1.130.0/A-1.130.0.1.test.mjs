import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/application/E-1.130/A-1.130.0/A-1.130.0.1.mjs";

test("requires application operational concerns", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-"));
  await writeFile(
    join(root, "AGENTS.md"),
    `## Application
Runtime entrypoint and lifecycle behavior; runtime configuration sources; safe operational boundaries.
`,
  );
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "AGENTS.md"), "## Application\nRuntime configuration\n");
  expect((await run({ root })).status).toBe("fail");
  await writeFile(
    join(root, "AGENTS.md"),
    "## Project\nApplication runtime configuration and shutdown workflow.\n",
  );
  expect((await run({ root })).status).toBe("fail");
  const incompleteSections = [
    "Lifecycle behavior; runtime configuration sources; safe operational boundaries.",
    "Runtime entrypoint; runtime configuration sources; safe operational boundaries.",
    "Entrypoint and lifecycle behavior; no settings are supported; safe operational boundaries.",
    "Runtime entrypoint and lifecycle behavior; runtime configuration sources.",
  ];
  for (const incomplete of incompleteSections) {
    await writeFile(join(root, "AGENTS.md"), `## Application\n${incomplete}`);
    expect((await run({ root })).status).toBe("fail");
  }
});

test("fails when application AGENTS guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-agents-missing-"));
  expect((await run({ root })).status).toBe("fail");
});
