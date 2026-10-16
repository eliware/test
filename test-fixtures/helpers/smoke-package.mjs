import { nextPatchVersion, packageVersion } from "./project-version.mjs";

export const packageJson = {
  name: "@eliware/test",
  version: packageVersion,
  private: false,
  engines: { node: ">=26" },
  publishConfig: { provenance: true },
  files: [
    "src/",
    "docs/",
    "README.md",
    "AGENTS.md",
    "LICENSE",
    "RELEASE_NOTES.md",
    "bin/",
    "specs/",
    "dictionary/",
  ],
  bin: { "eliware-test": "bin/eliware-test.mjs" },
  scripts: { pack: "node bin/eliware-test.mjs --pack" },
  eliware: { apply: ["application", "cli"] },
};

export const packedFiles = [
  "package.json",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "RELEASE_NOTES.md",
  "src/index.mjs",
  "docs/README.md",
  "bin/eliware-test.mjs",
  "specs/conventions/general.yaml",
  "dictionary/unapproved.csv",
];

export const smokeFailureCases = [
  [{ packCode: 1, packStderr: "pack output" }, "pack output"],
  [{ packCode: 1, noPackStdout: true }, "npm pack failed."],
  [{ noPackStdout: true }, "safe tarball filename"],
  [{ packStdout: "not-json" }, "safe tarball filename"],
  [packReport({ name: undefined, version: packageVersion }), "safe tarball filename"],
  [packReport({ version: nextPatchVersion }), "version does not match"],
  [packReport({ filename: "../x.tgz" }), "safe tarball filename"],
  [packReport(), "omitted"],
  [{ installCode: 1, installStdout: "install output" }, "Tarball installation failed"],
  [
    { installVersion: nextPatchVersion },
    `Installed package version ${nextPatchVersion} does not match ${packageVersion}`,
  ],
];

function packReport(entry = {}) {
  return {
    packStdout: JSON.stringify([
      { name: "@eliware/test", version: packageVersion, filename: "x.tgz", files: [], ...entry },
    ]),
  };
}
