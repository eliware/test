export const commonJsFindingsAst = {
  type: "Program",
  body: [
    { type: "CallExpression", callee: { type: "Identifier", name: "require" } },
    { type: "OptionalCallExpression", callee: { type: "Identifier", name: "require" } },
    {
      type: "MemberExpression",
      object: { type: "Identifier", name: "module" },
      property: { type: "Identifier", name: "exports" },
    },
    {
      type: "MemberExpression",
      object: { type: "Identifier", name: "exports" },
      property: { type: "Identifier", name: "value" },
    },
    { type: "Identifier", name: "__dirname" },
    { type: "Identifier", name: "__filename" },
    {
      type: "CallExpression",
      callee: {
        type: "MemberExpression",
        object: { type: "MetaProperty", meta: { name: "import" } },
        property: { type: "Identifier", name: "require" },
      },
    },
  ],
};
