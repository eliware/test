import { extname } from 'node:path';
import { SOURCE_EXTENSIONS } from './constants.mjs';

export function classifyFile(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  if (!SOURCE_EXTENSIONS.has(extname(normalized).toLowerCase())) return '';
  if (normalized.startsWith('tests/') || normalized.includes('/tests/') || normalized.startsWith('test/') || normalized.includes('/test/')) return 'test';
  if (normalized.startsWith('src/') || normalized.includes('/src/')) return 'source';
  return '';
}

export function isGeneratedFile(relativePath, source) {
  const normalized = relativePath.replaceAll('\\', '/').toLowerCase();
  return normalized.includes('/generated/') || normalized.startsWith('generated/') || normalized.includes('.generated.')
    || /^\s*(?:\/\/|\/\*)\s*@?generated\b/im.test(source);
}
