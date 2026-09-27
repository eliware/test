import { expect, test } from "@jest/globals";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveJestBin } from "../../../../../src/checks/general/E-0.1/E-0.1.20/resolve-jest-bin.mjs";

async function createConsumerPackage(metadata) {
  const root = await mkdtemp(join(tmpdir(), "eliware-jest-bin-"));
  const packageRoot = join(root, "node_modules", "jest");
  await mkdir(packageRoot, { recursive: true });
  await writeFile(join(root, "package.json"), JSON.stringify({ type: "module" }));
  await writeFile(join(packageRoot, "package.json"), JSON.stringify(metadata));
  return { root, packageRoot, requireFromConsumer: createRequire(join(root, "package.json")) };
}

test("resolves an exported Jest bin path", async () => {
  const fixture = await createConsumerPackage({
    name: "jest",
    exports: { "./bin/jest": "./commands/runner.mjs" },
    bin: { jest: "commands/runner.mjs" },
  });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    await writeFile(join(fixture.packageRoot, "commands", "runner.mjs"), "");
    expect(resolveJestBin(fixture.requireFromConsumer, "jest")).toBe(
      join(fixture.packageRoot, "commands", "runner.mjs"),
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test.each([
  ["metadata object", { jest: "commands/object.mjs" }, "commands/object.mjs"],
  ["metadata string", "commands/string.mjs", "commands/string.mjs"],
])("resolves Jest's declared bin from %s", async (_label, bin, expected) => {
  const fixture = await createConsumerPackage({ name: "jest", bin });
  try {
    await mkdir(join(fixture.packageRoot, "commands"));
    await writeFile(join(fixture.packageRoot, expected), "");
    expect(resolveJestBin(fixture.requireFromConsumer, "jest")).toBe(
      join(fixture.packageRoot, expected),
    );
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
});

test("returns no path when package resolution or bin metadata is invalid", async () => {
  const fixture = await createConsumerPackage({ name: "jest" });
  try {
    expect(resolveJestBin(fixture.requireFromConsumer, "jest")).toBeUndefined();
    await writeFile(join(fixture.packageRoot, "package.json"), "{");
    expect(resolveJestBin(fixture.requireFromConsumer, "jest")).toBeUndefined();
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
  expect(resolveJestBin(createRequire(join(tmpdir(), "no-consumer-package.json")), "jest"))
    .toBeUndefined();
});
