import { access } from "node:fs/promises";
import { referenceTarget } from "./reference-target.mjs";

export async function validateAuthorityReference({ root, file, reference, label }) {
  const resolved = referenceTarget(root, file, reference);
  if (resolved.error) return `${label} ${resolved.error}.`;
  try {
    await access(resolved.target);
  } catch {
    if (resolved.external) return null;
    return `${label} does not resolve: ${reference}.`;
  }
  return null;
}
