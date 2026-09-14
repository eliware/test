import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function fixture(conventions) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-"));
  await mkdir(join(root, "src", "checks", "general"), { recursive: true });
  await mkdir(join(root, "tests"), { recursive: true });
  await writeFile(
    join(root, "AGENTS.md"),
    "# fixture repository purpose\nNode.js 26 native ESM .mjs module environment validation. Scope boundaries repository-wide subdirectory instructions. Read README.md and applicable documentation before changes. Validation commands. Security secrets credentials machine. Actionable current concise guidance. Approved deviations and project-specific rules must not weaken shared requirements. Required files and structure. Web routes assets configuration browser deployment ports. Application configuration connection shutdown workflow. CLI entrypoint commands validation platform. eliware/docs eliware/conventions eliware/operations\n",
  );
  await writeFile(
    join(root, "README.md"),
    "# [![eliware.org](https://eliware.org/logos/brand.png)](https://github.com/eliware/fixture)\n\n# fixture\n\n## Purpose\nfixture\n## Requirements\nfixture\n## Setup\nfixture\n## Configuration\nfixture\n## Usage\nfixture\n## Validation\nfixture\n## Operations\nfixture\n## Security\nfixture\n## Support\nfixture\n## License\n[license](LICENSE) https://www.npmjs.com/package/@eliware/fixture\n[Release notes](RELEASE_NOTES.md)\n",
  );
  await writeFile(join(root, "RELEASE_NOTES.md"), "# Release notes\n## 8.0.0\n");
  await writeFile(join(root, "LICENSE"), "MIT License\nCopyright (c) 2026 Eliware\n");
  await writeFile(join(root, ".env.example"), "# safe example\n");
  await writeFile(
    join(root, ".gitignore"),
    "node_modules\n.git\ncoverage\nbuild\n.env\nbackup\ndump\nrestore\nruntime state\n.DS_Store\n",
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
    JSON.stringify({ directives: [{ id: "E-1", directives: [] }] }),
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
          implementation: {},
          verification: {},
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
    "git pull --ff-only origin main\nnpm ci\nnpm test\n",
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
    engines: { node: ">=26" },
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
      exempt: conventions.exempt ?? [],
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
      packages: {},
    }),
  );
  return root;
}
