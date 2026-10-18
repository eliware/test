export function hasRepositoryRoot(program, name, dirname, fileURLToPath) {
  if (!dirname || !fileURLToPath) return false;
  return program.body.some(
    (item) =>
      item.type === "VariableDeclaration" &&
      item.declarations.some((declaration) => {
        const init = declaration.init;
        const fileUrl = init?.arguments?.[0];
        const importMetaUrl = fileUrl?.arguments?.[0];
        return (
          declaration.id.type === "Identifier" &&
          declaration.id.name === name &&
          init?.type === "CallExpression" &&
          init.callee.name === dirname &&
          fileUrl?.type === "CallExpression" &&
          fileUrl.callee.name === fileURLToPath &&
          importMetaUrl?.type === "MemberExpression" &&
          importMetaUrl.object.type === "MetaProperty" &&
          importMetaUrl.object.meta.name === "import" &&
          importMetaUrl.object.property.name === "meta" &&
          importMetaUrl.property.name === "url"
        );
      }),
  );
}
