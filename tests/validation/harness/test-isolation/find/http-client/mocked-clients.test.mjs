import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectMockedClients } from "../../../../../../src/validation/harness/test-isolation/find/http-client/mocked-clients.mjs";

test("collects direct and computed Jest spies for HTTP methods", () => {
  const ast = parse(
    'jest.spyOn(client, "request"); jest["spyOn"](client, "get"); jest.spyOn(client, "write");',
  );
  expect([...collectMockedClients(ast)]).toEqual(["client"]);
});
