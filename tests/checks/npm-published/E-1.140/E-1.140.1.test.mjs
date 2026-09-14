import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/npm-published/E-1.140/E-1.140.1.mjs";

test("requires the public package publication contract", async () => {
  const packageJson = {
    engines: { node: ">=26 <27" },
    publishConfig: { provenance: true },
    files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
    scripts: { pack: "eliware-test --pack" },
  };
  await expect(run({ packageJson })).resolves.toEqual({
    ruleId: "E-1.140.1",
    status: "pass",
    message: "",
  });
  await expect(
    run({ packageJson: { ...packageJson, scripts: { pack: "npm pack" } } }),
  ).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("reports pack diagnostics when the pack stage fails", async () => {
  const packageJson = {
    engines: { node: ">=26 <27" },
    publishConfig: { provenance: true },
    files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
    scripts: { pack: "eliware-test --pack" },
  };
  await expect(
    run({
      packageJson,
      root: "C:\\repo",
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 1, stdout: "pack findings", stderr: "" }),
    }),
  ).resolves.toEqual({
    ruleId: "E-1.140.1",
    status: "fail",
    message: "npm pack failed: pack findings",
  });
});

const validPackage = {
  engines: { node: ">=26 <27" },
  publishConfig: { provenance: true },
  files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
  scripts: { pack: "eliware-test --pack" },
};

test.each([
  { engines: { node: ">=25" } },
  { publishConfig: {} },
  { files: ["README.md"] },
  { scripts: {} },
])("rejects incomplete package publication metadata %#", async (override) => {
  await expect(run({ packageJson: { ...validPackage, ...override } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("handles successful and skipped pack execution", async () => {
  await expect(run({ packageJson: validPackage, executePack: true, mode: "other", runPack: async () => ({ code: 0 }) })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
  await expect(run({ packageJson: validPackage, executePack: true, mode: "pack", runPack: async () => ({ code: 0, stdout: JSON.stringify([{ files: ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md", "docs/README.md", "specs/README.md"].map((path) => ({ path })) }]) }) })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
  await expect(run({ packageJson: validPackage, executePack: true, mode: "pack", runPack: async () => ({ code: 1, stdout: "", stderr: "" }) })).resolves.toEqual(
    expect.objectContaining({ message: "npm pack failed without diagnostics." }),
  );
  await expect(run({ packageJson: validPackage, executePack: true, mode: "pack", runPack: async () => { throw new Error("spawn failed"); } })).resolves.toEqual(
    expect.objectContaining({ message: "npm pack could not be started: spawn failed" }),
  );
});
