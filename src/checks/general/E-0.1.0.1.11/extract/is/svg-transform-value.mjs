export function isSvgTransformValue(value, parent) {
  if (parent?.type === "JSXAttribute" && parent.name?.name === "transform") return true;
  return (
    parent?.type === "CallExpression" &&
    parent.callee?.property?.name === "setAttribute" &&
    parent.arguments?.[0]?.value === "transform" &&
    parent.arguments[1] === value
  );
}
