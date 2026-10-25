export function isUniversalIgnoreRule(rule, name) {
  if (rule.startsWith("!")) return false;
  const pattern = rule.replace(/\/$/u, "");
  return pattern === name || pattern === `**/${name}` || pattern === `**/${name}/**`;
}
