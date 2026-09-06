function finding(message) { return { group: 'conventions', message }; }

/** Reject repository-local copies of the centralized convention drift tracker. */
export function checkRepositoryDriftFiles(files) {
  return [...files].filter((file) => file.toLowerCase().endsWith('known_drifts.md'))
    .map((file) => finding(`repository: local known_drifts.md is prohibited: ${file}`));
}
