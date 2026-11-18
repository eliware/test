import validateJestSourceFilePolicy from "./file-policy.mjs";
import isPrimaryLibraryBarrel from "./is-primary-library-barrel.mjs";
export default function validateJestPolicyFiles(files, errors, packageJson, harness) {
  for (const { path, content } of files) {
    errors.push(
      ...validateJestSourceFilePolicy(path, content, {
        harness,
        allowLibraryBarrel: isPrimaryLibraryBarrel(packageJson, path),
      }),
    );
  }
  return errors;
}
