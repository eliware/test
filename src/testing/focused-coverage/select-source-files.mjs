/** Return unique, non-empty source paths eligible for focused coverage. */
export function selectSourceFiles(sourcePaths = []) {
  if (!Array.isArray(sourcePaths)) throw new TypeError('selectSourceFiles requires source paths');
  return [...new Set(sourcePaths.filter((path) => typeof path === 'string' && path.length > 0))];
}
