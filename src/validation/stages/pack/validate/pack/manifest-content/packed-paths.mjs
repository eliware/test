export default function validatePackedManifestShape(packed) {
  if (!Array.isArray(packed) || packed.some((entry) => typeof entry?.path !== "string"))
    return "npm pack JSON manifest must contain a files array with paths.";
  return null;
}
