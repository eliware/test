function walk(node, parent, ancestry, errors) {
  if (!node || typeof node.id !== "string" || !/^[EA]-\d+(?:\.\d+)*$/.test(node.id)) {
    errors.push("Every directive must have a valid E- or A-prefixed ID.");
    return;
  }
  if (parent) {
    const parentPath = parent.id.slice(2).split(".");
    const childPath = node.id.slice(2).split(".");
    if (
      childPath.length !== parentPath.length + 1 ||
      parentPath.some((segment, index) => childPath[index] !== segment)
    ) {
      errors.push(`Directive ${node.id} must be nested under ${parent.id}.`);
    }
  }
  if (!parent && !node.id.startsWith("E-"))
    errors.push(`Top-level directive ${node.id} must be an E-rule.`);
  if (node.id.startsWith("E-") && ancestry.some((id) => id.startsWith("A-")))
    errors.push(`E-rule ${node.id} cannot be nested under an A-rule.`);
  if (node.id.startsWith("A-") && !ancestry.some((id) => id.startsWith("E-")))
    errors.push(`A-rule ${node.id} must have an E-rule ancestor.`);
  if (node.directives !== undefined && !Array.isArray(node.directives))
    errors.push(`Directive ${node.id}.directives must be an array.`);
  for (const child of node.directives ?? []) walk(child, node, [...ancestry, node.id], errors);
}

export function validateDirectiveTree(directives) {
  const errors = [];
  for (const directive of directives) walk(directive, null, [], errors);
  return errors;
}
