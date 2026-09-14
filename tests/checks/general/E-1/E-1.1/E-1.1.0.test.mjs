import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.1/E-1.1.0.mjs";

const readme = `# [![eliware.org](https://eliware.org/logos/brand.png)](https://github.com/eliware/fixture)
## Purpose
A maintained fixture.
## Requirements
Node.js 26.
## Setup
Install dependencies.
## Configuration
Use package.json.
## Usage
Run the test command.
## Validation
Run validation.
## Operations
Use the runbooks.
## Security
Do not commit secrets.
## Support
Use GitHub issues.
## License
[license](LICENSE)
Description: Fixture project.
Keywords: fixture.
Author: Eliware.
Repository: https://github.com/eliware/fixture
License: MIT.
[![CI](https://github.com/eliware/fixture/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/nodejs.yml)
`;

test("accepts a complete branded project README", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-"));
  await writeFile(join(root, "README.md"), readme);
  await expect(
    run({
      root,
      packageJson: {
        description: "Fixture project.",
        keywords: ["fixture"],
        author: "Eliware",
        repository: "https://github.com/eliware/fixture",
        license: "MIT",
      },
    }),
  ).resolves.toEqual({ ruleId: "E-1.1.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports missing README sections", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-"));
  await writeFile(join(root, "README.md"), "# fixture");
  await expect(run({ root, packageJson: {} })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("Purpose") }),
  );
  await rm(root, { recursive: true, force: true });
});

async function runVariant(content, packageJson = {}) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-variant-"));
  await writeFile(join(root, "README.md"), content);
  const result = await run({ root, packageJson });
  await rm(root, { recursive: true, force: true });
  return result;
}

test("requires the standard branding, CI badge, and license link", async () => {
  await expect(runVariant(readme.replace("eliware.org/logos/brand.png", "brand.png"))).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("standard Eliware branding") }),
  );
  await expect(runVariant(readme.replaceAll("actions/workflows/", "workflows/"))).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("GitHub CI badge") }),
  );
  await expect(runVariant(readme.replace("[license](LICENSE)", "License text"))).resolves.toEqual(
    expect.objectContaining({ message: expect.stringContaining("license badge") }),
  );
});

test("requires publication metadata and package metadata to be represented", async () => {
  await expect(
    runVariant(readme, { publishConfig: { access: "public" } }),
  ).resolves.toEqual(expect.objectContaining({ message: expect.stringContaining("npm version") }));
  await expect(
    runVariant(readme, { description: "Different description" }),
  ).resolves.toEqual(expect.objectContaining({ message: expect.stringContaining("project description") }));
  await expect(
    runVariant(readme, { keywords: ["unlisted"] }),
  ).resolves.toEqual(expect.objectContaining({ message: expect.stringContaining("package keywords") }));
  await expect(runVariant(readme, { keywords: "fixture" })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
});

test("requires a root README", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-missing-"));
  await expect(run({ root, packageJson: {} })).resolves.toEqual({
    ruleId: "E-1.1.0",
    status: "fail",
    message: "README.md is required.",
  });
  await rm(root, { recursive: true, force: true });
});
