export function filterMonolithViolations(files, config) { return files.filter((entry) => !entry.generated && !entry.pureBarrel && !matchesExemption(entry.file, config.exemptions)).filter((entry) => entry.lines > config[entry.kind]).map((entry) => ({ ...entry, threshold: config[entry.kind] })); }
function matchesExemption(file, exemptions) {
  const fileIsWindows = /^[A-Za-z]:[\\/]/.test(file) || file.startsWith('//');
  const normalizedFile = file.split('\\').join('/');
  return exemptions.some(({ pattern }) => {
    const patternIsWindows = /^[A-Za-z]:[\\/]/.test(pattern) || pattern.startsWith('//') || pattern.includes('\\');
    const caseInsensitive = fileIsWindows && patternIsWindows;
    const escaped = pattern.split('\\').join('/').split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
    const normalizedPattern = escaped.join('.*');
    return new RegExp(`^${normalizedPattern}$`, caseInsensitive ? 'i' : '').test(normalizedFile);
  });
}
