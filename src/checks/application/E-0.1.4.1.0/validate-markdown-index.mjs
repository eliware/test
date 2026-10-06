export function validateMarkdownIndex(content, expectedPaths, indexPath) {
  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/gu)].map(([, target]) => target);
  const errors = [];
  for (const path of expectedPaths)
    if (!links.includes(path) && !links.includes(`./${path}`))
      errors.push(`${indexPath} must link ${path}.`);
  return errors;
}
