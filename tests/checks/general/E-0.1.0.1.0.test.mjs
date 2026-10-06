import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, ruleId } from "../../../src/checks/general/E-0.1.0.1.0.mjs";

const packageJson = { name: "@eliware/example", eliware: { id: "E-1", apply: ["general"] } };

test("passes valid metadata when optional repository data is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-rule-"));
  try {
    await expect(run({ root, packageJson })).resolves.toEqual({
      ruleId,
      status: "pass",
      message: "",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses the current directory when context has no root", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

test("reports mismatched repo-map metadata", async () => {
  const base = await mkdtemp(join(tmpdir(), "eliware-rule-"));
  const root = join(base, "repo");
  const docs = join(base, "docs");
  await mkdir(root);
  await mkdir(docs, { recursive: true });
  try {
    await writeFile(
      join(docs, "repo-map.yaml"),
      "repositories:\n  - repository: eliware/example\n    id: E-2\n    description: Example\n    keywords: [example]\n    profiles: [general]\n",
    );
    const result = await run({ root, packageJson: { ...packageJson, description: "Mismatch" } });
    expect(result.status).toBe("fail");
    expect(result.message).toContain("must match repo-map.yaml");
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("passes when package metadata matches the repo map", async () => {
  const base = await mkdtemp(join(tmpdir(), "eliware-rule-"));
  const root = join(base, "repo");
  const docs = join(base, "docs");
  await mkdir(root);
  await mkdir(docs);
  const matchingPackage = {
    name: "@eliware/example",
    description: "Example",
    keywords: ["example"],
    eliware: { id: "E-1", apply: ["general"] },
  };
  try {
    await writeFile(
      join(docs, "repo-map.yaml"),
      "repositories:\n  - repository: eliware/example\n    id: E-1\n    description: Example\n    keywords: [example]\n    profiles: [general]\n",
    );
    await expect(run({ root, packageJson: matchingPackage })).resolves.toMatchObject({
      status: "pass",
    });
  } finally {
    await rm(base, { recursive: true, force: true });
  }
});

test("reports invalid Eliware metadata", async () => {
  const result = await run({ packageJson: { eliware: { apply: ["general", "general"] } } });
  expect(result).toMatchObject({ status: "fail" });
  expect(result.message).toContain("ordered keys");
  expect(result.message).toContain("duplicate profile");
});

test("reports mismatched paired convention metadata", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-rule-"));
  const directory = join(root, "specs", "conventions");
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(join(directory, "general-semantic.yaml"), "version: '12.0'\nrequires: []\n");
    await writeFile(
      join(directory, "general-deterministic.yaml"),
      "version: '11.0'\nrequires: [application]\n",
    );
    const result = await run({ root, packageJson });
    expect(result.status).toBe("fail");
    expect(result.message).toContain("same version");
    expect(result.message).toContain("same prerequisites");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
