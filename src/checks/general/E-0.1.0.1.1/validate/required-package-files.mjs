import { stat } from "node:fs/promises";
import { join } from "node:path";

const requiredFiles = [
  "package.json",
  "package-lock.json",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "specs/README.md",
  "docs/README.md",
  "RELEASE_NOTES.md",
];

export default async function validateRequiredPackageFiles(root, { getStat = stat } = {}) {
  const errors = [];
  for (const file of requiredFiles) {
    try {
      if (!(await getStat(join(root, file))).isFile()) errors.push(`${file} must be a file.`);
    } catch {
      errors.push(`${file} is required at the repository root.`);
    }
  }
  return errors;
}
