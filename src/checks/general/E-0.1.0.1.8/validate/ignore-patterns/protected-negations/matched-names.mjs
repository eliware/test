import { minimatch } from "minimatch";

const protectedDirectories = [
  "node_modules",
  ".git",
  "coverage",
  "dist",
  "build",
  "generated",
  "artifacts",
  "test-results",
];
const protectedFiles = [".DS_Store", "Thumbs.db"];

export function findProtectedNegationMatches(rule) {
  const pattern = rule.slice(1).replace(/^\//u, "").replace(/\/$/u, "");
  if (!pattern) return [];
  const segments = pattern.split("/");
  const matchedDirectories = protectedDirectories.filter((name) =>
    segments.some(
      (segment, segmentIndex) =>
        minimatch(name, segment, { dot: true }) &&
        segments.slice(segmentIndex + 1).every((tail) => tail === "**"),
    ),
  );
  const matchedFiles = protectedFiles.filter((name) =>
    segments.some(
      (segment, segmentIndex) =>
        segmentIndex === segments.length - 1 && minimatch(name, segment, { dot: true }),
    ),
  );
  return [...matchedDirectories, ...matchedFiles];
}
