import { appendFile, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function fixture(conventions) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-"));
  await mkdir(join(root, "bin"), { recursive: true });
  await writeFile(join(root, "bin", "eliware-test.mjs"), "#!/usr/bin/env node\n");
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(join(root, "src", "module.mjs"), "export const moduleValue = true;\n");
  await writeFile(join(root, "tests", "module.test.mjs"), "import \"../../src/module.mjs\";\ntest(\"module\", () => {});\n");
  await writeFile(
    join(root, "AGENTS.md"),
    "# fixture\n\n## Instruction scope\nRepository-wide purpose and scope.\n\n## Read before changing\nRead README.md and relevant records.\n\n## Authoritative sources\neliware/docs, eliware/conventions, and eliware/operations.\n\n## Repository identity\nProject: fixture.\n\n## Scope and boundaries\nValidation fixture only.\n\n## Required structure\nRequired files and directories are indexed.\n\n## Security and secrets\nDo not commit secrets, credentials, tokens, or machine state.\n\n## Validation\nRun npm test and npm run lint; keep guidance actionable, current, and concise.\n\n## Approved deviations\nProject-specific deviations must not weaken shared requirements.\n\n## Change control and authorization\nDo not publish without authorization.\n\n## Subdirectory instructions\nNone.\n",
  );
  await appendFile(join(root, "AGENTS.md"), "\nNode.js 26 native ESM .mjs module environment validation.\n");
  await writeFile(
    join(root, "README.md"),
    "# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)\n## @eliware/fixture [![npm version](https://img.shields.io/npm/v/@eliware/fixture.svg)](https://www.npmjs.com/package/@eliware/fixture) [![license](https://img.shields.io/github/license/eliware/fixture.svg)](LICENSE) [![CI](https://github.com/eliware/fixture/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eliware/fixture/actions/workflows/nodejs.yml)\nDocumentation: [docs](docs/README.md) · [specifications](specs/README.md) · [examples](examples/README.md)\n## Purpose\nfixture\n## Requirements\nNode.js 26.\n## Setup\nfixture\n## Configuration\nfixture\n## Usage\nfixture\n## Validation\nfixture\n## Operations\nfixture\n## Security\nfixture\n## Support\n[Discord](https://discord.gg/M6aTR9eTwN) eliware.org on Discord\n## License\n[LICENSE](LICENSE)\n## Links\nEliware: [site](https://eliware.org) [GitHub](https://github.com/eliware) [npm](https://www.npmjs.com/package/@eliware/fixture)\n[Release notes](RELEASE_NOTES.md)\nDescription: fixture\nKeywords: fixture\nAuthor: Eliware <eliware@eliware.org>\nRepository: https://github.com/eliware/fixture\nLicense: MIT\n",
  );
  await writeFile(join(root, "RELEASE_NOTES.md"), "# Release notes\n## 8.0.0\n### Added\n- Fixture baseline.\n### Fixed\n- Fixture validation.\n");
  await writeFile(join(root, ".env"), "MAIL_OWNER_ADDRESS=fixture@eliware.org\n");
  await writeFile(join(root, "LICENSE"), `MIT License\n\nCopyright (c) 2026 Eliware\n\nPermission is hereby granted\nTHE SOFTWARE IS PROVIDED "AS IS"\nWITHOUT WARRANTY OF ANY KIND\nIN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE\n`);
  await writeFile(join(root, ".env.example"), "# safe example\n");
  await writeFile(
    join(root, ".gitignore"),
    "node_modules/\n.git/\ncoverage/\nbuild/\ndist/\n.cache/\n.env*\n!.env.example\n.vscode/\nbackup/\ndump/\nrestore/\nruntime/\n.DS_Store\n",
  );
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, "docs", "README.md"), "# docs\n");
  await mkdir(join(root, "examples"), { recursive: true });
  await writeFile(join(root, "examples", "README.md"), "# examples\n");
  await mkdir(join(root, "specs"), { recursive: true });
  await writeFile(
    join(root, "specs", "README.md"),
    "# specs\n- [authority.json](authority.json)\n- [directives.json](directives.json)\n- [contracts.json](contracts.json)\n",
  );
  await writeFile(join(root, "specs", "authority.json"), "{}");
  await writeFile(
    join(root, "specs", "directives.json"),
    JSON.stringify({ directives: [{ id: "E-1", directives: [{ id: "E-1.25", directives: [] }] }] }),
  );
  await writeFile(
    join(root, "specs", "contracts.json"),
    JSON.stringify({
      schemaVersion: "1.0",
      contractVersion: "8.0",
      kind: "contract-reference",
      description: "fixture",
      authority: {},
      format: {},
      contracts: [
        {
          id: "C-1.1",
          title: "fixture",
          scope: "test",
          directiveIds: ["E-1.25"],
          dos: [],
          donts: [],
          contract: {
            purpose: "",
            inputs: [],
            outputs: [],
            errors: [],
            ordering: [],
            invariants: [],
            boundaries: {},
          },
          implementation: { source: ["bin/eliware-test.mjs"] },
          verification: { tests: ["tests"] },
        },
      ],
    }),
  );
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "validation.yml"),
    "on:\n  push:\n  pull_request:\n\nconcurrency:\n  group: ${{ github.repository }}-${{ github.ref }}\n  cancel-in-progress: true\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm ci\n      - run: npm test\n",
  );
  await mkdir(join(root, ".knit"), { recursive: true });
  await writeFile(
    join(root, ".knit", "validate.mjs"),
    'import { spawnSync } from "node:child_process";\nspawnSync("git", ["pull", "--ff-only", "origin", "main"]);\nspawnSync("npm", ["ci"]);\nspawnSync("npm", ["test"]);\n',
  );
  await writeFile(join(root, ".knit", "deploy.yaml"), "version: 1\n");
  const packageJson = {
    name: "@eliware/fixture",
    version: "8.0.0",
    description: "fixture",
    author: "Eliware <eliware@eliware.org>",
    keywords: ["fixture"],
    license: "MIT",
    bin: { "eliware-test": "./bin/eliware-test.mjs" },
    files: ["bin", "src", "specs", "docs", "examples", "README.md", "LICENSE", "RELEASE_NOTES.md"],
    publishConfig: { access: "public" },
    repository: { type: "git", url: "https://github.com/eliware/fixture" },
    homepage: "https://github.com/eliware/fixture#readme",
    type: "module",
    engines: { node: ">=26 <27" },
    dependencies: {},
    scripts: {
      test: "eliware-test",
      lint: "eliware-test --lint",
      audit: "eliware-test --audit",
      format: "eliware-test --format",
      "format:check": "eliware-test --format-check",
    },
    prettier: {
      printWidth: 100,
      tabWidth: 2,
      semi: true,
      singleQuote: false,
      trailingComma: "all",
    },
    jest: { collectCoverageFrom: ["src/**/*.mjs"] },
    eliware: {
      apply: conventions.apply,
      exempt: [
        ...(conventions.exempt ?? []),
        { ruleId: "E-1.6.0", path: ".env", reason: "Fixture-only local environment file.", approver: "Eli", approvalTimestamp: "2026-09-14T00:00:00Z", expiry: null },
      ],
      authority: { authoritativeFor: ["fixture"], notAuthoritativeFor: ["runtime"] },
      crosslinks: [
        {
          path: "../docs/authority-map.json",
          relation: "relatedAuthority",
          authoritativeFor: "fixture",
        },
      ],
    },
  };
  await writeFile(join(root, "package.json"), JSON.stringify(packageJson));
  await writeFile(
    join(root, "package-lock.json"),
    JSON.stringify({
      name: "@eliware/fixture",
      version: "8.0.0",
      lockfileVersion: 3,
      packages: { "": { name: "@eliware/fixture", version: "8.0.0" } },
    }),
  );
  return root;
}
