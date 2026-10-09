import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, ruleId } from "../../../src/checks/shared/E-0.1.0.1.2.mjs";

const agents = [
  "# AGENTS.md",
  "## Project",
  "## Scope and boundaries",
  "## Layout",
  "## Development",
  "## Validation",
  "## Security",
  "## Changes",
  "## Application",
  "## CLI",
  "Node.js 26 native ESM npm test npm run lint npm run audit npm run format npm run format:check",
].join("\n");

test("accepts this repository's AGENTS guide", async () => {
  await expect(
    run({
      root: process.cwd(),
      packageJson: JSON.parse(await readFile("package.json", "utf8")),
    }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses the current directory when the context omits its root", async () => {
  await expect(
    run({ packageJson: JSON.parse(await readFile("package.json", "utf8")) }),
  ).resolves.toEqual({ ruleId, status: "pass", message: "" });
});

test("uses default arguments when callers pass undefined", async () => {
  await expect(run(undefined, undefined)).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "AGENTS.md has duplicate, undeclared, or misordered section headings.",
  });
});

test("uses an injected reader for AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-agents-"));
  try {
    await expect(
      run(
        { root, packageJson: { eliware: { apply: ["application", "cli"] } } },
        {
          read: async () => agents,
        },
      ),
    ).resolves.toEqual({
      ruleId,
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports a missing AGENTS file", async () => {
  await expect(run({ root: "missing" })).resolves.toMatchObject({
    ruleId,
    status: "fail",
    message: "AGENTS.md is required at the repository root.",
  });
});

test("reports markers, headings, specification, and knit failures", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-agents-"));
  try {
    await mkdir(join(root, ".knit"));
    await writeFile(
      join(root, "AGENTS.md"),
      `${agents.replace("native ESM", "module syntax")}\n## Undeclared`,
    );
    await writeFile(join(root, ".knit", "README.md"), "not allowed");
    const result = await run({ root, packageJson: { eliware: { apply: ["application"] } } });
    expect(result.status).toBe("fail");
    expect(result.message).toContain("native ESM");
    expect(result.message).toContain("undeclared");
    expect(result.message).toContain("inside .knit");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports a specification read error", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-agents-"));
  try {
    await writeFile(join(root, "AGENTS.md"), agents);
    await mkdir(join(root, "specs"));
    await writeFile(join(root, "specs", "invalid.yaml"), "invalid: [\n");
    const result = await run({ root, packageJson: { eliware: { apply: [] } } });
    expect(result.message).toContain("Repository specifications could not be read");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reports errors when the knit path cannot be checked", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-agents-"));
  const access = async () => {
    const error = new Error("blocked");
    error.code = "EACCES";
    throw error;
  };
  try {
    await writeFile(join(root, "AGENTS.md"), agents);
    const result = await run({ root, packageJson: {} }, { access });
    expect(result.message).toContain(".knit/README.md could not be checked");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
