import { isUserFacingAttribute } from "./attributes.mjs";
import { isUserFacingOutputCall } from "./calls.mjs";
import { isUserFacingOutputProperty } from "./properties.mjs";
import { collectOutputText } from "./text.mjs";

export function collectOutputProse(value, blocks) {
  if (value.type === "JSXText") {
    addText(value.value, value.loc.start.line, blocks);
    return false;
  }
  if (value.type === "JSXAttribute") {
    if (isUserFacingAttribute(value.name?.name)) {
      const expression =
        value.value?.type === "JSXExpressionContainer" ? value.value.expression : value.value;
      addText(expression, value.loc.start.line, blocks);
    }
    return false;
  }
  if (value.type === "CallExpression" && isUserFacingOutputCall(value.callee)) {
    for (const argument of value.arguments) addText(argument, value.loc.start.line, blocks);
  }
  if (value.type === "AssignmentExpression" && isUserFacingOutputProperty(value.left))
    addText(value.right, value.loc.start.line, blocks);
  if (value.type === "CallExpression" && isSetAttributeOutput(value))
    addText(value.arguments[1], value.loc.start.line, blocks);
}

function addText(value, line, blocks) {
  for (const text of collectOutputText(value)) {
    if (text.trim()) blocks.push({ text, line, kind: "prose" });
  }
}

function isSetAttributeOutput(call) {
  return (
    call.callee?.type === "MemberExpression" &&
    !call.callee.computed &&
    call.callee.property?.name === "setAttribute" &&
    call.arguments[0]?.type === "StringLiteral" &&
    isUserFacingAttribute(call.arguments[0].value)
  );
}
