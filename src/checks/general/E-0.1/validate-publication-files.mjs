import { existsSync } from "node:fs";
import { join } from "node:path";

const publishedFiles = ["README.md", "LICENSE", "RELEASE_NOTES.md", "docs", "specs"];

function isPublicPackage(packageJson) {
  return packageJson?.eliware?.apply?.includes("npm-published");
}

export function validatePublicationFiles(packageJson, root) {
  if (!isPublicPackage(packageJson)) return null;
  const failures = [];
  if (
    !Array.isArray(packageJson.files) ||
    packageJson.files.length === 0 ||
    packageJson.files.some((file) => typeof file !== "string" || file.trim().length === 0)
  )
    return "Public npm packages must define a nonempty files allowlist.";
  if (packageJson.files.some((file) => /(?:^|[\\/])(?:\*|\*\*|\.)/.test(file)))
    failures.push("Public npm package files must not use broad or wildcard allowlist entries.");
  const allowlist = new Set(packageJson.files.map((file) => file.replace(/[\\/]$/, "")));
  const missing = publishedFiles.filter((file) => !allowlist.has(file));
  if (missing.length > 0)
    failures.push(`Public npm package files must allowlist: ${missing.join(", ")}.`);
  for (const file of publishedFiles) {
    try {
      if (typeof root !== "string" || root.length === 0) throw new Error("missing root");
      if (!existsSync(join(root, file))) throw new Error("missing");
    } catch {
      failures.push(`Public npm package file or directory is missing: ${file}.`);
    }
  }
  for (const file of allowlist) {
    if (typeof root !== "string" || root.length === 0 || !existsSync(join(root, file)))
      failures.push(`Public npm package allowlist target is missing: ${file}.`);
  }
  return failures.length ? failures.join("\n") : null;
}
