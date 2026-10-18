import { readPackManifest } from "../../read-pack-manifest.mjs";
import { validatePackedEntrypoints } from "../packed/entrypoints.mjs";
import { validatePackManifestContent } from "./manifest-content.mjs";

export function validatePackManifest(stdout, files, packageName, packageJson = {}) {
  const parsed = readPackManifest(stdout, packageName);
  if (parsed.error) return parsed.error;
  const { entry } = parsed;
  const packed = entry.files;
  const contentError = validatePackManifestContent(packed, files);
  if (contentError) return contentError;
  const packedPaths = new Set(packed.map((item) => item.path));
  return validatePackedEntrypoints(packageJson, packedPaths);
}
