import { expect, test } from "@jest/globals";
import { validateReadmeRequiredContent } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-required-content.mjs";

const readme = `# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)
## @eliware/fixture [![license](https://img.shields.io/github/license/eliware/fixture.svg)](LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/ci.yml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/ci.yml)
## Table of Contents
[Features](#features) · [Requirements](#requirements) · [Setup](#setup) · [Usage](#usage) · [Development](#development) · [Testing](#testing) · [Troubleshooting](#troubleshooting) · [Security](#security) · [Support](#support) · [License](#license) · [Links](#links)
## Features
Content.
## Requirements
Content.
## Setup
Content.
## Usage
Content.
## Development
Content.
## Testing
Content.
## Troubleshooting
Content.
## Security
Content.
## Support
https://discord.gg/M6aTR9eTwN eliware.org on Discord
## License
[license](LICENSE)
## Links
Documentation: [docs](docs/README.md) [specifications](specs/README.md) [examples](examples/README.md)
https://eliware.org https://github.com/eliware https://github.com/eliware/fixture`;

test("composes the focused README validators", () => {
  expect(
    validateReadmeRequiredContent(readme, {
      name: "@eliware/fixture",
      repository: "https://github.com/eliware/fixture",
    }),
  ).toBeNull();
  expect(validateReadmeRequiredContent(readme.replace("# [!", "# [bad!"))).toContain(
    "branding line",
  );
});
