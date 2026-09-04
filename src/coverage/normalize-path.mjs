/** Normalize a reported coverage path relative to the workspace when possible. */
export function normalizeCoveragePath(file, root) {
  const normalizedFile = typeof file === 'string' ? file.replaceAll('\\', '/') : 'unknown';
  const normalizedRoot = typeof root === 'string' ? root.replaceAll('\\', '/').replace(/\/+$/, '') : '';
  const rootPrefix = `${normalizedRoot}/`;
  return normalizedRoot && /^[A-Za-z]:[\\/]|^\//.test(normalizedFile) && normalizedFile.startsWith(rootPrefix)
    ? normalizedFile.slice(rootPrefix.length)
    : normalizedFile;
}
