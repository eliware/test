import { resolve } from "node:path";
import { readAuthorityTarget } from "./read-authority-target.mjs";

export async function validateAuthorityReciprocity({ root, file, entries, inventory }) {
  const failures = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const authority = await readAuthorityTarget({
      root,
      file,
      reference: entry.authorityFile,
      label: `${entry.repository}.authorityFile`,
      inventory,
    });
    if (authority.error) {
      failures.push(authority.error);
      continue;
    }
    if (!authority.unavailable && authority.document?.repositoryId !== entry.repository) {
      failures.push(
        `${entry.repository}.authorityFile repositoryId does not match registry entry.`,
      );
    }
    if (
      !authority.unavailable &&
      Array.isArray(authority.document?.subjects) &&
      Array.isArray(entry.governs)
    ) {
      const subjectIds = new Set(
        authority.document.subjects.map((subject) => subject?.id).filter(Boolean),
      );
      const missing = entry.governs.filter((target) => !subjectIds.has(target));
      if (missing.length > 0)
        failures.push(
          `${entry.repository}.governs target does not resolve to a local subject: ${missing.join(", ")}.`,
        );
    }
    if (!authority.unavailable && typeof authority.document?.globalAuthorityMap !== "string") {
      failures.push(`${entry.repository}.authority.json must declare globalAuthorityMap.`);
      continue;
    }
    if (!authority.unavailable) {
      const reciprocal = await readAuthorityTarget({
        root,
        file: authority.target,
        reference: authority.document.globalAuthorityMap,
        label: `${entry.repository}.globalAuthorityMap`,
        inventory,
      });
      if (reciprocal.error) {
        failures.push(reciprocal.error);
        continue;
      }
      if (!reciprocal.unavailable && resolve(reciprocal.target) !== resolve(file)) {
        failures.push(
          `${entry.repository}.globalAuthorityMap does not point back to authority-map.json.`,
        );
      }
    }
  }
  return failures.length ? failures.join("\n") : null;
}
