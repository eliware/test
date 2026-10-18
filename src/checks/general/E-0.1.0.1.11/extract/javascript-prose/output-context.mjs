const userFacingAttributes = new Set(["alt", "aria-label", "placeholder", "title"]);
const domTextProperties = new Set([
  "ariaLabel",
  "innerText",
  "placeholder",
  "textContent",
  "title",
]);
const consoleMethods = new Set(["error", "info", "log", "warn"]);
const promptMethods = new Set(["alert", "confirm", "prompt"]);
const replyMethods = new Set(["editReply", "followUp", "reply"]);

export function isUserFacingAttribute(name) {
  return userFacingAttributes.has(name);
}

export function isUserFacingOutputCall(callee) {
  if (callee?.type === "Identifier") return promptMethods.has(callee.name);
  if (callee?.type !== "MemberExpression") return false;
  const method = memberName(callee);
  if (callee.object?.type === "Identifier" && callee.object.name === "console")
    return consoleMethods.has(method);
  if (
    callee.object?.type === "MemberExpression" &&
    callee.object.object?.type === "Identifier" &&
    callee.object.object.name === "process" &&
    ["stderr", "stdout"].includes(memberName(callee.object))
  )
    return method === "write";
  if (callee.object?.type === "Identifier" && callee.object.name === "window")
    return promptMethods.has(method);
  if (callee.object?.type === "Identifier" && callee.object.name === "readline")
    return method === "question";
  return replyMethods.has(method);
}

export function isUserFacingOutputProperty(target) {
  return target?.type === "MemberExpression" && domTextProperties.has(memberName(target));
}

export function collectOutputText(value) {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  if (value.type === "StringLiteral") return [value.value];
  if (value.type === "TemplateLiteral") {
    return [value.quasis.map((part) => part.value.cooked ?? part.value.raw).join("")];
  }
  if (value.type === "BinaryExpression" && value.operator === "+")
    return [...collectOutputText(value.left), ...collectOutputText(value.right)];
  if (value.type === "TaggedTemplateExpression") return collectOutputText(value.quasi);
  return [];
}

function memberName(member) {
  if (member.computed && member.property?.type === "StringLiteral") return member.property.value;
  return member.property?.name;
}
