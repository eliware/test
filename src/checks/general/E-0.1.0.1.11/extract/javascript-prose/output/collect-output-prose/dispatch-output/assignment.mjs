import collectOutputPropertyProse from "../properties.mjs";
export default function dispatchOutputAssignment(value, blocks) {
  if (value.type === "AssignmentExpression") collectOutputPropertyProse(value, blocks);
}
