import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execute } from "../../execute-child-process.mjs";
import { resolvePackExecutable } from "./resolve-pack-executable.mjs";
import { validatePublicationMetadata } from "./validate-publication-metadata.mjs";
import { captureSmokeTargetState } from "./capture-smoke-target-state.mjs";
import { restoreSmokeTargetState } from "./restore-smoke-target-state.mjs";
import { packSmokeCandidate } from "./pack-smoke-candidate.mjs";
import { installSmokeCandidate } from "./install-smoke-candidate.mjs";
import { prepareSmokeTarget } from "./prepare-smoke-target.mjs";
import { loadSmokeTarget } from "./load-smoke-target.mjs";

export async function runNpmConsumerSmoke({
  root,
  target,
  packageJson,
  run = execute,
  resolveCommand = resolvePackExecutable,
  env = process.env,
  captureState = captureSmokeTargetState,
  restoreState = restoreSmokeTargetState,
  write = () => {},
}) {
  if (typeof target !== "string" || !target.trim())
    return "Supply one existing consumer with --target <path>.";
  const metadataError = validatePublicationMetadata(packageJson, {
    selfHosted: packageJson?.name === "@eliware/test",
  });
  if (metadataError) return metadataError;
  if (typeof packageJson?.name !== "string" || typeof packageJson?.version !== "string")
    return "Source package name and version are required for tarball smoke.";
  const targetRoot = resolve(root, target);
  if (targetRoot === resolve(root)) return "Smoke target must be a separate consumer repository.";
  const loadedTarget = await loadSmokeTarget(targetRoot, packageJson?.name);
  if (loadedTarget.error) return loadedTarget.error;
  const { targetPackage } = loadedTarget;
  const binNames = Object.keys(packageJson?.bin ?? {});
  const childEnv = { ...env };
  const tempRoot = await mkdtemp(join(tmpdir(), "eliware-tarball-smoke-"));
  const packDirectory = join(tempRoot, "pack");
  let state;
  let outcome;
  try {
    state = await captureState(targetRoot, packageJson.name, binNames);
    write(`Target recovery snapshot: ${state.storage}`);
    await mkdir(packDirectory);
    const [command, prefix] = resolveCommand(childEnv, process.platform, process.execPath, root);
    const { tarball, digest } = await packSmokeCandidate({
      root,
      packageJson,
      run,
      command,
      prefix,
      packDirectory,
      env: childEnv,
    });
    await prepareSmokeTarget({
      targetRoot,
      targetPackage,
      packageName: packageJson.name,
      tarball,
      run,
      command,
      prefix,
      env: childEnv,
    });
    await installSmokeCandidate({
      targetRoot,
      packageJson,
      tarball,
      run,
      command,
      prefix,
      env: childEnv,
    });
    outcome = `Smoke passed: ${packageJson.name}@${packageJson.version}; SHA-256 ${digest}.`;
  } catch (error) {
    outcome = `Tarball consumer smoke failed: ${error.message}`;
  } finally {
    let restoreError;
    if (state && !state.error) {
      try {
        await restoreState(state);
      } catch (error) {
        restoreError = error.message;
      }
    }
    await rm(tempRoot, { recursive: true, force: true });
    if (restoreError) outcome = `${outcome} Target restoration failed: ${restoreError}`;
    else if (state && !state.error) outcome = `${outcome} Previous target package state restored.`;
  }
  return outcome;
}
