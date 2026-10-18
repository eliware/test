import { memberName } from "./member-name.mjs";

const consoleMethods = new Set(["error", "info", "log", "warn"]);
const promptMethods = new Set(["alert", "confirm", "prompt"]);
const replyMethods = new Set(["editReply", "followUp", "reply"]);

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
