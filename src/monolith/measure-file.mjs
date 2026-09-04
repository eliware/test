import { classifyMonolithFile, isPureBarrel } from './classify.mjs';

/** Read and classify one workspace file for monolith policy evaluation. */
export async function measureMonolithFile(file, readSource) {
  const kind = classifyMonolithFile(file.relative);
  if (!kind) return null;
  const source = await readSource(file.absolute, 'utf8');
  return {
    file: file.relative,
    kind,
    lines: source.length ? source.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length : 0,
    generated: /(?:^|\/)(?:generated)(?:\/|$)|\.generated\.|@generated\b/i.test(`${file.relative}\n${source}`),
    pureBarrel: kind === 'source' && isPureBarrel(source),
  };
}
