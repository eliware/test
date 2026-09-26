export function countSourceLines(source) {
  if (source.length === 0) return 0;
  return (source.match(/\n/gu) ?? []).length + (source.endsWith("\n") ? 0 : 1);
}
