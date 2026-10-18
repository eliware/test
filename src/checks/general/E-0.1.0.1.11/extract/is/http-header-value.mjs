const headerMethodNames = new Set(["header", "setHeader", "appendHeader"]);
const headerNames = new Set([
  "content-disposition",
  "content-security-policy",
  "content-type",
  "cache-control",
  "set-cookie",
]);

export function isHttpHeaderValue(value, parent) {
  if (isHeaderCallValue(value, parent) || isMimeTypeCallValue(value, parent)) return true;
  return parent?.type === "ObjectProperty" && isKnownHeaderName(parent.key);
}

function isHeaderCallValue(value, parent) {
  if (parent?.type !== "CallExpression" || parent.arguments[1] !== value) return false;
  const callee = parent.callee;
  if (callee?.type !== "MemberExpression") return false;
  const method = callee.computed ? callee.property?.value : callee.property?.name;
  return headerMethodNames.has(method) && isHeaderFieldName(parent.arguments[0]);
}

function isMimeTypeCallValue(value, parent) {
  if (parent?.type !== "CallExpression" || parent.arguments[0] !== value) return false;
  const callee = parent.callee;
  if (callee?.type !== "MemberExpression") return false;
  const method = callee.computed ? callee.property?.value : callee.property?.name;
  const text =
    value.type === "StringLiteral"
      ? value.value
      : value.type === "TemplateLiteral"
        ? value.quasis.map(({ value: part }) => part.raw).join("")
        : undefined;
  return method === "type" && typeof text === "string" && isMimeType(text);
}

function isMimeType(value) {
  return /^[\w!#$&^.+-]+\/[\w!#$&^.+-]+(?=\s*(?:;|$))/u.test(value);
}

function isKnownHeaderName(value) {
  const name = value?.type === "StringLiteral" ? value.value : value?.name;
  return typeof name === "string" && headerNames.has(name.toLowerCase());
}

function isHeaderFieldName(value) {
  const name = value?.type === "StringLiteral" ? value.value : value?.name;
  return typeof name === "string" && /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/u.test(name);
}
