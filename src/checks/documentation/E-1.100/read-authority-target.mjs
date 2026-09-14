import { access, readFile, stat } from "node:fs/promises";
import { referenceTarget } from "./reference-target.mjs";

export async function readAuthorityTarget({ root, file, reference, label }) {
  const resolved = referenceTarget(root, file, reference);
  if (resolved.error) return { error: `${label} ${resolved.error}.` };
  try {
    await access(resolved.target);
    const details = await stat(resolved.target);
    return {
      ...resolved,
      details,
      document: details.isFile() ? JSON.parse(await readFile(resolved.target, "utf8")) : null,
    };
  } catch (error) {
    if (resolved.external) return { ...resolved, unavailable: true };
    return { error: `${label} does not resolve: ${reference} (${error.message}).` };
  }
}
