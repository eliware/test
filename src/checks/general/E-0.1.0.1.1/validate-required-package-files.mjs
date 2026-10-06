import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const requiredFiles = [
  "package.json",
  "package-lock.json",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "specs/README.md",
];
const licenseMarkers = [
  "MIT License",
  "Copyright (c) 2026 Eliware",
  "Permission is hereby granted",
  'THE SOFTWARE IS PROVIDED "AS IS"',
  "WITHOUT WARRANTY OF ANY KIND",
  "IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE",
];

export async function validateRequiredPackageFiles(root, { getStat = stat, read = readFile } = {}) {
  const errors = [];
  for (const file of requiredFiles) {
    try {
      if (!(await getStat(join(root, file))).isFile()) errors.push(`${file} must be a file.`);
    } catch {
      errors.push(`${file} is required at the repository root.`);
    }
  }
  try {
    const license = (await read(join(root, "LICENSE"), "utf8")).replace(/\s+/gu, " ");
    const missing = licenseMarkers.filter(
      (marker) => !license.includes(marker.replace(/\s+/gu, " ")),
    );
    if (missing.length) errors.push(`LICENSE is missing approved MIT text: ${missing.join(", ")}.`);
  } catch {
    errors.push("LICENSE could not be read.");
  }
  return errors;
}
