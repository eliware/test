import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { readCliEntrypointSurface } from "../../../../src/checks/cli/E-0.1.60/read-cli-entrypoint-surface.mjs";

async function createSurface(readme, entrypoint = "console.log('safe');") {
  const root = await mkdtemp(join(tmpdir(), "eliware-cli-surface-"));
  await mkdir(join(root, "bin"));
  await writeFile(join(root, "bin", "cli.mjs"), entrypoint);
  await writeFile(join(root, "README.md"), readme);
  return root;
}

test("requires an entrypoint and existing README and entrypoint files", async () => {
  await expect(readCliEntrypointSurface({ root: "/repo", packageJson: {} })).resolves.toEqual({
    error: "CLI repositories must declare a bin entrypoint.",
  });
  const root = await mkdtemp(join(tmpdir(), "eliware-cli-surface-missing-"));
  try {
    await expect(
      readCliEntrypointSurface({ root, packageJson: { bin: "bin/cli.mjs" } }),
    ).resolves.toEqual({ error: "Every declared CLI bin entrypoint and README.md must exist." });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires documented help, version, and exit-code behavior", async () => {
  for (const [readme, term] of [
    ["--version exit code", "--help"],
    ["--help exit code", "--version"],
    ["--help --version", "exit code"],
  ]) {
    const root = await createSurface(readme);
    try {
      await expect(
        readCliEntrypointSurface({ root, packageJson: { bin: "bin/cli.mjs" } }),
      ).resolves.toEqual({ error: `CLI README.md must document ${term}.` });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("rejects destructive entrypoints without confirmation controls", async () => {
  const root = await createSurface("--help --version exit code", "delete resource;");
  try {
    await expect(
      readCliEntrypointSurface({ root, packageJson: { bin: "bin/cli.mjs" } }),
    ).resolves.toEqual({
      error: "Destructive CLI actions must provide dry-run or confirmation controls.",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads and accepts documented safe CLI surfaces", async () => {
  const root = await createSurface("--help --version exit code", "console.log('safe');");
  const readText = jest.fn(async (path) =>
    path.endsWith("README.md") ? "--help --version exit code" : "console.log('safe');",
  );
  try {
    const result = await readCliEntrypointSurface({
      root,
      packageJson: { bin: { cli: "bin/cli.mjs" } },
      repositoryInventory: { readText },
    });
    expect(result).toEqual({ entrypoints: ["bin/cli.mjs"], readme: "--help --version exit code" });
    expect(readText).toHaveBeenCalledWith(join(root, "README.md"));
    expect(readText).toHaveBeenCalledWith(join(root, "bin", "cli.mjs"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
