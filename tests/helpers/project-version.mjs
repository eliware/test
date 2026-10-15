import { readFileSync } from "node:fs";

const packageJson = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);
const [major, minor, patch] = packageJson.version.split(".").map(Number);

export const packageVersion = packageJson.version;
export const conventionVersion = `${major}.${minor}`;
export const runbookSchemaVersion = major;
export const previousMajorVersion = `${major - 1}.0.0`;
export const nextMajorVersion = `${major + 1}.0.0`;
export const nextMinorVersion = `${major}.${minor + 1}.0`;
export const nextPatchVersion = `${major}.${minor}.${patch + 1}`;
