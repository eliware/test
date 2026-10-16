import { expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const stat = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, stat }));
jest.unstable_mockModule(
  "../../../src/validation/shared/repository/find-repository-files.mjs",
  () => ({
    findRepositoryFiles: async () => [],
  }),
);
const { run, ruleId } = await import("../../../src/checks/general/E-0.1.0.1.1.mjs");

const packageJson = {
  name: "@eliware/fixture",
  version: "13.0.0",
  type: "module",
  description: "Fixture package.",
  keywords: ["fixture"],
  private: true,
  engines: { node: ">=26" },
  author: "Eliware <eliware@eliware.org>",
  license: "MIT",
  repository: { type: "git", url: "git+https://github.com/eliware/fixture.git" },
  homepage: "https://github.com/eliware/fixture#readme",
  bugs: { url: "https://github.com/eliware/fixture/issues" },
};
const license = `MIT License\n\nCopyright (c) 2026 Eliware\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`;
const packageLock = {
  name: packageJson.name,
  version: packageJson.version,
  lockfileVersion: 3,
  packages: { "": { name: packageJson.name, version: packageJson.version } },
};
const dependencies = {
  getStat: async () => ({ isFile: () => true }),
  read: async (path) => (String(path).endsWith("LICENSE") ? license : JSON.stringify(packageLock)),
};

test("validates this repository package contract", async () => {
  await expect(
    run(
      {
        root: "/repo",
        packageJson,
        repositoryFiles: [],
      },
      dependencies,
    ),
  ).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("reports package metadata and required file failures together", async () => {
  const result = await run({ root: "missing", packageJson: {}, repositoryFiles: [] });
  expect(result).toMatchObject({ ruleId, status: "fail" });
  expect(result.message).toContain("scoped @eliware");
  expect(result.message).toContain("package-lock.json is required");
});

test("reports source scan failures", async () => {
  const result = await run(
    {
      root: "/repo",
      packageJson: {},
      repositoryFiles: ["invalid.mjs"],
      parseAst: async () => {
        throw new Error("blocked");
      },
    },
    dependencies,
  );
  expect(result.message).toContain("invalid.mjs: invalid module syntax (blocked)");
});

test("uses the inventory file reader when no file list is supplied", async () => {
  const result = await run(
    {
      root: "/repo",
      packageJson,
      repositoryInventory: { repositoryFiles: async () => [] },
    },
    dependencies,
  );
  expect(result.status).toBe("pass");
});

test("uses default arguments", async () => {
  stat.mockResolvedValue({ isFile: () => true });
  readFile.mockImplementation(async (path) =>
    String(path).endsWith("LICENSE") ? license : JSON.stringify(packageLock),
  );
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});
