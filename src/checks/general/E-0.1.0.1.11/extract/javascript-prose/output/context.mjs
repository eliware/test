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
  return (
    isDialogOutputCall(callee) ||
    isConsoleOutputCall(callee) ||
    isProcessOutputCall(callee) ||
    isReadlineOutputCall(callee) ||
    isReplyOutputCall(callee)
  );
}

function isDialogOutputCall(callee) {
  if (callee?.type === "Identifier") return promptMethods.has(callee.name);
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "window" &&
    promptMethods.has(memberName(callee))
  );
}

function isConsoleOutputCall(callee) {
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "console" &&
    consoleMethods.has(memberName(callee))
  );
}

function isProcessOutputCall(callee) {
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "MemberExpression" &&
    callee.object.object?.type === "Identifier" &&
    callee.object.object.name === "process" &&
    ["stderr", "stdout"].includes(memberName(callee.object)) &&
    memberName(callee) === "write"
  );
}

function isReadlineOutputCall(callee) {
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "readline" &&
    memberName(callee) === "question"
  );
}

function isReplyOutputCall(callee) {
  return callee?.type === "MemberExpression" && replyMethods.has(memberName(callee));
}

export function isUserFacingOutputProperty(target) {
  return target?.type === "MemberExpression" && domTextProperties.has(memberName(target));
}

function memberName(member) {
  if (member.computed && member.property?.type === "StringLiteral") return member.property.value;
  return member.property?.name;
}
