import { resolve } from "node:path";
import { readAuthorityTarget } from "./read-authority-target.mjs";

export async function validateAuthorityReciprocity({ root, file, entries }) {
  for (const entry of entries) {
    const authority = await readAuthorityTarget({
      root,
      file,
      reference: entry.authorityFile,
      label: `${entry.repository}.authorityFile`,
    });
    if (authority.error) return authority.error;
    if (!authority.unavailable && authority.document?.repositoryId !== entry.repository) {
      return `${entry.repository}.authorityFile repositoryId does not match registry entry.`;
    }
    if (!authority.unavailable && Array.isArray(authority.document?.subjects) && Array.isArray(entry.governs)) {
      const subjectIds = new Set(authority.document.subjects.map((subject) => subject?.id).filter(Boolean));
      const missing = entry.governs.filter((target) => !subjectIds.has(target));
      if (missing.length > 0) return `${entry.repository}.governs target does not resolve to a local subject: ${missing.join(", ")}.`;
    }
    if (!authority.unavailable && typeof authority.document?.globalAuthorityMap === "string") {
      const reciprocal = await readAuthorityTarget({
        root,
        file: authority.target,
        reference: authority.document.globalAuthorityMap,
        label: `${entry.repository}.globalAuthorityMap`,
      });
      if (reciprocal.error) return reciprocal.error;
      if (!reciprocal.unavailable && resolve(reciprocal.target) !== resolve(file)) {
        return `${entry.repository}.globalAuthorityMap does not point back to authority-map.json.`;
      }
    }
  }
  return null;
}
