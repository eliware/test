export async function validateRegeneratedLockfile(packageJson, lockfile, regeneratedMatches) {
  try {
    if (!(await regeneratedMatches(packageJson, lockfile))) {
      return "package-lock.json does not match npm's regenerated dependency resolution.";
    }
  } catch (error) {
    return error.message;
  }
  return null;
}
