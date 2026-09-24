import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../../src/checks/general/E-1/E-1.1/E-1.1.0.mjs";

const readme = `# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)
## @eliware/fixture [![npm version](https://img.shields.io/npm/v/@eliware/fixture.svg)](https://www.npmjs.com/package/@eliware/fixture) [![license](https://img.shields.io/github/license/eliware/fixture.svg)](LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/fixture/actions)
## Table of Contents
[Features](#features) · [Requirements](#requirements) · [Setup](#setup) · [Usage](#usage) · [Development](#development) · [Testing](#testing) · [Troubleshooting](#troubleshooting) · [Security](#security) · [Support](#support) · [License](#license) · [Links](#links)
## Features
Validation features.
## Requirements
Node.js 26.
## Setup
Install dependencies.
## Usage
Run the test command.
## Development
Use native ESM modules.
## Testing
Run the tests.
## Troubleshooting
Inspect diagnostics.
## Security
Do not commit secrets.
## Support
[Discord](https://discord.gg/M6aTR9eTwN)
eliware.org on Discord
## License
[license](LICENSE)
## Links
Documentation: [docs](docs/README.md) · [specifications](specs/README.md) · [examples](examples/README.md)
Home Page: https://eliware.org
GitHub: https://github.com/eliware/fixture
GitHub organization: https://github.com/eliware
npm: https://www.npmjs.com/package/@eliware/fixture
Discord: https://discord.gg/M6aTR9eTwN
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
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "specs", "README.md"), "specs");
  await expect(
    run({
      root,
      packageJson: {
        name: "@eliware/fixture",
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
    expect.objectContaining({ status: "fail", message: expect.stringContaining("Features") }),
  );
  await rm(root, { recursive: true, force: true });
});

async function runVariant(content, packageJson = {}) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-variant-"));
  await writeFile(join(root, "README.md"), content);
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "specs"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await writeFile(join(root, "specs", "README.md"), "specs");
  const result = await run({ root, packageJson });
  await rm(root, { recursive: true, force: true });
  return result;
}

test("returns the first delegated branding, content, and metadata failure", async () => {
  await expect(runVariant(readme.replace("eliware.org/logos/brand.png", "brand.png"))).resolves.toMatchObject({
    message: expect.stringContaining("standard Eliware branding"),
  });
  await expect(runVariant(readme.replace("Documentation:", "Docs:"))).resolves.toMatchObject({
    message: expect.stringContaining("Documentation navigation"),
  });
  await expect(runVariant(readme, { description: "Different description" })).resolves.toMatchObject({
    message: expect.stringContaining("project description"),
  });
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

test("requires the examples index when examples are present", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-examples-"));
  await writeFile(join(root, "README.md"), readme);
  await mkdir(join(root, "docs"));
  await mkdir(join(root, "specs"));
  await mkdir(join(root, "examples"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await writeFile(join(root, "specs", "README.md"), "specs");
  await expect(run({ root, packageJson: {} })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("examples/README.md"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});

test("requires both documentation indexes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-readme-indexes-"));
  await writeFile(join(root, "README.md"), readme);
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "README.md"), "docs");
  await expect(run({ root, packageJson: {} })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("specs/README.md"),
    }),
  );
  await rm(root, { recursive: true, force: true });
});
