export function formatIstanbulIgnoreFailure(violations) {
  const details = violations.map(({ file, line }) => `  ${file}:${line}`).join('\n');
  return `Istanbul ignore directives are only allowed in pure barrel files:\n${details}\n`;
}
