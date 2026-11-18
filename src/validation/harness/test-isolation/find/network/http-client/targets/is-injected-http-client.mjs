function isInjectedHttpClient(node) {
  const root = rootName(node);
  return (
    typeof root === "string" && /^(?:http|https|httpClient|httpsClient|requestClient)$/iu.test(root)
  );
}
function rootName(node) {
  if (node?.type === "Identifier") return node.name;
  if (["MemberExpression", "OptionalMemberExpression"].includes(node?.type))
    return rootName(node.object);
  return undefined;
}
export default isInjectedHttpClient;
