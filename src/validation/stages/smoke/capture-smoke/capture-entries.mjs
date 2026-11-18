import cleanupFailedSmokeCapture from "./cleanup-failed-capture.mjs";
import captureSmokePaths from "./paths.mjs";

export default async function captureSmokeEntries(
  root,
  packageName,
  binNames,
  fs,
  platform,
  storage,
  assertPackageParents,
) {
  if (typeof storage !== "string" || !storage)
    throw new Error("Smoke state storage must be inside the smoke workspace.");
  try {
    return await captureSmokePaths(
      root,
      packageName,
      binNames,
      storage,
      fs,
      platform,
      assertPackageParents,
    );
  } catch (error) {
    await cleanupFailedSmokeCapture(storage, fs, error);
  }
}
