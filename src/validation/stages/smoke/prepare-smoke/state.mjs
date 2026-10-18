export async function prepareSmokeState({
  targetRoot,
  packageJson,
  binNames,
  assertTargetIdentity,
  assertPackageParents,
  captureState,
  backupDirectory,
  createDirectory,
  write,
  platform,
}) {
  await assertTargetIdentity();
  await assertPackageParents(targetRoot, packageJson.name);
  await createDirectory(backupDirectory);
  const state = await captureState(
    targetRoot,
    packageJson.name,
    binNames,
    undefined,
    platform,
    backupDirectory,
  );
  write(`Target recovery snapshot: ${state.storage}`);
  return state;
}
