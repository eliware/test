import collectJestSpyCalls from "../../mocks/collect-jest-spy-calls.mjs";
const methods = new Set(["get", "request"]);
export default function collectMockedClients(ast) {
  const clients = new Set();
  for (const { target, property } of collectJestSpyCalls(ast))
    if (target?.type === "Identifier" && methods.has(property)) clients.add(target.name);
  return clients;
}
