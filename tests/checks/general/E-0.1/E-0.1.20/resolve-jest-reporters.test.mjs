import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { resolveJestReporters } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-jest-reporters.mjs";

test("combines configured reporters with unique harness reporters", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-reporters-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ jest: { reporters: ["summary", "default"] } }));
    const reporters = await resolveJestReporters(root, ["--debug-timing"]);
    expect(reporters).toContain("summary");
    expect(reporters.filter((reporter) => reporter === "default")).toHaveLength(1);
    expect(reporters.some((reporter) => reporter.endsWith("jest-progress-reporter.mjs"))).toBe(true);
    expect(reporters.some((reporter) => reporter.endsWith("jest-timing-reporter.mjs"))).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects reporter options that cannot be forwarded by the CLI", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-reporters-options-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ jest: { reporters: [["summary", {}]] } }));
    await expect(resolveJestReporters(root)).rejects.toThrow("per-reporter options");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses harness defaults when package reporters are absent and timing is disabled", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-default-reporters-"));
  try {
    await writeFile(join(root, "package.json"), "{}\n");
    const reporters = await resolveJestReporters(root);
    expect(reporters).toContain("default");
    expect(reporters.some((reporter) => reporter.endsWith("jest-progress-reporter.mjs"))).toBe(true);
    expect(reporters.some((reporter) => reporter.endsWith("jest-timing-reporter.mjs"))).toBe(false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects reporters that are not a string array", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-invalid-reporters-"));
  try {
    await writeFile(join(root, "package.json"), JSON.stringify({ jest: { reporters: "summary" } }));
    await expect(resolveJestReporters(root)).rejects.toThrow("per-reporter options");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
