const sqlStart =
  /^\s*(?:SELECT\b|INSERT\s+(?:IGNORE\s+)?INTO\b|UPDATE\b|DELETE\s+FROM\b|REPLACE\s+INTO\b|WITH\b|CALL\s+[\w.]+\s*\(|CREATE\b|ALTER\b|DROP\b|TRUNCATE\b|PRAGMA\b|SHOW\s+(?:TABLES|COLUMNS|DATABASES|SCHEMAS|CREATE|STATUS|VARIABLES)\b|DESCRIBE\b|EXPLAIN\s+(?:SELECT|INSERT|UPDATE|DELETE|WITH)\b)/iu;

export function isSqlQueryArgument(value, parent) {
  if (parent?.type !== "CallExpression" || parent.arguments[0] !== value) return false;
  const callee = parent.callee;
  if (callee?.type !== "MemberExpression") return false;
  const method = callee.computed ? callee.property?.value : callee.property?.name;
  if (method !== "query" && method !== "execute") return false;
  const text = value.type === "StringLiteral" ? value.value : templateText(value);
  return typeof text === "string" && sqlStart.test(text);
}

function templateText(value) {
  return value.type === "TemplateLiteral"
    ? value.quasis.map(({ value: part }) => part.raw).join(" ")
    : undefined;
}
