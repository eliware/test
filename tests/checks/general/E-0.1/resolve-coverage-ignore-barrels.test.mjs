import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveCoverageIgnoreBarrels } from "../../../../src/checks/general/E-0.1/resolve-coverage-ignore-barrels.mjs";

test("does not allow barrel exemptions outside application and library profiles", async () => {
  const findBarrels = jest.fn().mockResolvedValue(["src/index.mjs"]);
  const repositoryInventory = {};
  const policy = await resolveCoverageIgnoreBarrels(
    "/repo",
    { eliware: { apply: ["private"] }, exports: { ".": "./src/index.mjs" } },
    repositoryInventory,
    findBarrels,
  );

  expect(findBarrels).toHaveBeenCalledWith("/repo", undefined, repositoryInventory);
  expect(policy.barrels).toEqual(new Set(["src/index.mjs"]));
  expect(policy.allowedBarrels).toEqual(new Set());
  const absentPackagePolicy = await resolveCoverageIgnoreBarrels(
    "/repo",
    undefined,
    undefined,
    async () => [],
  );
  expect(absentPackagePolicy.allowedBarrels).toEqual(new Set());
});

test("resolves public entrypoint exemptions for application repositories", async () => {
  const policy = await resolveCoverageIgnoreBarrels(
    "/repo",
    { eliware: { apply: ["application"] }, exports: { ".": "./src/index.mjs" } },
    undefined,
    async () => ["src/index.mjs", "src/internal.mjs"],
  );

  expect(policy.allowedBarrels).toEqual(new Set(["src/index.mjs"]));
  const libraryPolicy = await resolveCoverageIgnoreBarrels(
    "/repo",
    { eliware: { apply: ["library"] }, exports: { ".": "./src/index.mjs" } },
    undefined,
    async () => ["src/index.mjs"],
  );
  expect(libraryPolicy.allowedBarrels).toEqual(new Set(["src/index.mjs"]));
});

test("discovers source barrels when no barrel finder is injected", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-barrels-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "index.mjs"), "export { value } from './value.mjs';\n");
  try {
    const policy = await resolveCoverageIgnoreBarrels(root, {
      eliware: { apply: ["application"] },
      exports: { ".": "./src/index.mjs" },
    });

    expect(policy.barrels).toEqual(new Set(["src/index.mjs"]));
    expect(policy.allowedBarrels).toEqual(new Set(["src/index.mjs"]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
