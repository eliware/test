import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const packageJson = {
  name: "@eliware/test",
  version: "11.0.0",
  engines: { node: "26" },
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
  ],
  bin: { "eliware-test": "bin/eliware-test.mjs" },
  scripts: { pack: "node bin/eliware-test.mjs --pack" },
  eliware: { apply: ["cli"] },
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
];

export async function createSmokeTarget(roots) {
  const root = await mkdtemp(join(tmpdir(), "eliware-consumer-test-"));
  roots.push(root);
  const source = join(root, "source");
  const target = join(root, "consumer");
  const installed = join(target, "node_modules", "@eliware", "test");
  await mkdir(installed, { recursive: true });
  await mkdir(join(target, "node_modules", ".bin"), { recursive: true });
  await writeFile(
    join(target, "package.json"),
    JSON.stringify({
      scripts: { test: "eliware-test" },
      devDependencies: { "@eliware/test": "10.0.0" },
    }),
  );
  await writeFile(join(target, "package-lock.json"), "old-lock\n");
  await writeFile(join(target, "node_modules", ".package-lock.json"), "old-tree-lock\n");
  await writeFile(
    join(installed, "package.json"),
    JSON.stringify({ name: "@eliware/test", version: "10.0.0" }),
  );
  await writeFile(join(target, "node_modules", ".bin", "eliware-test.cmd"), "old-bin\n");
  return { root, source, target, installed };
}

export function fakeNpm(target, config = {}) {
  const calls = [];
  const testedManifest = { dependency: null };
  const {
    testCode = 0,
    packCode = 0,
    installCode = 0,
    installVersion = packageJson.version,
  } = config;
  const manifest =
    config.packStdout ??
    JSON.stringify([
      {
        name: packageJson.name,
        version: packageJson.version,
        filename: "eliware-test-11.0.0.tgz",
        files: packedFiles.map((path) => ({ path })),
      },
    ]);
  const run = async (_command, args, options) => {
    calls.push({ args, options });
    if (args.includes("pack")) {
      const output = args[args.indexOf("--pack-destination") + 1];
      await writeFile(join(output, "eliware-test-11.0.0.tgz"), "candidate tarball");
      return {
        code: packCode,
        stdout: config.noPackStdout ? undefined : manifest,
        stderr: config.packStderr ?? "",
      };
    }
    if (args.includes("install")) {
      if (args.includes("--package-lock-only")) return { code: 0, stdout: "lock updated" };
      const installed = join(target, "node_modules", "@eliware", "test");
      await rm(installed, { recursive: true, force: true });
      await mkdir(installed, { recursive: true });
      await writeFile(
        join(installed, "package.json"),
        JSON.stringify({ name: packageJson.name, version: installVersion }),
      );
      return { code: installCode, stdout: config.installStdout ?? "installed" };
    }
    const targetPackage = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
    testedManifest.dependency = targetPackage.devDependencies?.[packageJson.name];
    return { code: testCode, stdout: testCode ? "consumer failure" : "consumer passed" };
  };
  return { calls, run, testedManifest };
}

export async function removeRoots(roots) {
  await Promise.all(roots.map((root) => rm(root, { recursive: true, force: true })));
}
