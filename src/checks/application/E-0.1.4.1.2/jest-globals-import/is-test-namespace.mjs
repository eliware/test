function isTestNamespace(node, names) {
  return (
    node?.type === "Identifier" &&
    (names.namespaces.has(node.name) ||
      (["global", "globalThis"].includes(node.name) && !names.shadowedGlobals?.has(node.name)))
  );
}
export default isTestNamespace;
