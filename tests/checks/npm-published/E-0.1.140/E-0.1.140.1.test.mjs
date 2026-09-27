import { expect, jest, test } from "@jest/globals";
import { run } from "../../../../src/checks/npm-published/E-0.1.140/E-0.1.140.1.mjs";

test("requires the public package publication contract", async () => {
  const packageJson = {
    engines: { node: ">=26 <27" },
    publishConfig: { provenance: true },
    files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
    scripts: { pack: "eliware-test --pack" },
  };
  await expect(run({ packageJson })).resolves.toEqual({
    ruleId: "E-0.1.140.1",
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
    ruleId: "E-0.1.140.1",
    status: "fail",
    message: "npm pack failed: pack findings",
  });
});

test("accepts the local pack script and still runs pack validation", async () => {
  const packageJson = {
    name: "@eliware/test",
    engines: { node: ">=26 <27" },
    publishConfig: { provenance: true },
    files: ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs/", "specs/"],
    scripts: { pack: "node bin/eliware-test.mjs --pack" },
  };
  const manifest = JSON.stringify([
    {
      name: "@eliware/test",
      files: [
        "package.json",
        "README.md",
        "LICENSE",
        "RELEASE_NOTES.md",
        "docs/README.md",
        "specs/README.md",
      ].map((path) => ({ path })),
    },
  ]);
  const runPack = jest.fn(async () => ({ code: 0, stdout: manifest, stderr: "" }));
  await expect(
    run({ packageJson, executePack: true, mode: "pack", runPack }),
  ).resolves.toMatchObject({
    status: "pass",
  });
  expect(runPack).toHaveBeenCalledTimes(1);
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
  await expect(
    run({
      packageJson: validPackage,
      executePack: true,
      mode: "other",
      runPack: async () => ({ code: 0 }),
    }),
  ).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await expect(
    run({
      packageJson: validPackage,
      executePack: true,
      mode: "pack",
      runPack: async () => ({
        code: 0,
        stdout: JSON.stringify([
          {
            files: [
              "package.json",
              "README.md",
              "LICENSE",
              "RELEASE_NOTES.md",
              "docs/README.md",
              "specs/README.md",
            ].map((path) => ({ path })),
          },
        ]),
      }),
    }),
  ).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await expect(
    run({
      packageJson: validPackage,
      executePack: true,
      mode: "pack",
      runPack: async () => ({ code: 1, stdout: "", stderr: "" }),
    }),
  ).resolves.toEqual(expect.objectContaining({ message: "npm pack failed without diagnostics." }));
  await expect(
    run({
      packageJson: validPackage,
      executePack: true,
      mode: "pack",
      runPack: async () => {
        throw new Error("spawn failed");
      },
    }),
  ).resolves.toEqual(
    expect.objectContaining({ message: "npm pack could not be started: spawn failed" }),
  );
});
