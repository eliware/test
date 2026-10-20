import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectJestSpyCalls } from "../../../../../../src/validation/harness/test-isolation/find/mocks/collect-jest-spy-calls.mjs";

test("collects direct and computed Jest spy calls with their targets", () => {
  const ast = parse(
    'jest.spyOn(client, "request"); jest["spyOn"](globalThis, "fetch"); other.spyOn(window, "fetch");',
  );
  expect(
    collectJestSpyCalls(ast).map(({ method, target, property }) => ({
      method,
      target: target.name,
      property,
    })),
  ).toEqual([
    { method: "spyOn", target: "client", property: "request" },
    { method: "spyOn", target: "globalThis", property: "fetch" },
  ]);
});

test("ignores non-call and non-spy expressions", () => {
  expect(collectJestSpyCalls(parse('jest.mock("client"); jest.spyOn;'))).toEqual([]);
});
