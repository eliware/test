import { expect, test } from "@jest/globals";
import {
  identifierOrMemberRoot,
  memberChain,
} from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-member-chain.mjs";

test("resolves member roots and static property names", () => {
  const node = {
    type: "MemberExpression",
    computed: true,
    property: { type: "Identifier", name: "dynamic" },
    object: {
      type: "MemberExpression",
      computed: false,
      property: { type: "Identifier", name: "env" },
      object: { type: "Identifier", name: "process" },
    },
  };
  expect(memberChain(node)).toEqual({ root: "process", names: [undefined, "env"] });
  expect(
    memberChain({
      type: "OptionalMemberExpression",
      computed: true,
      property: { type: "StringLiteral", value: "fetch" },
      object: { type: "Identifier", name: "globalThis" },
    }),
  ).toEqual({ root: "globalThis", names: ["fetch"] });
  expect(
    memberChain({
      type: "MemberExpression",
      computed: false,
      property: { type: "Identifier", name: "member" },
      object: { type: "CallExpression" },
    }),
  ).toEqual({ root: undefined, names: ["member"] });
  expect(identifierOrMemberRoot(node)).toBe("process");
  expect(identifierOrMemberRoot({ type: "Identifier", name: "globalThis" })).toBe("globalThis");
  expect(identifierOrMemberRoot({ type: "CallExpression" })).toBeUndefined();
});
