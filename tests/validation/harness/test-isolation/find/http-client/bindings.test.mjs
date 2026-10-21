import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { collectHttpBindings } from "../../../../../../src/validation/harness/test-isolation/find/http-client/bindings.mjs";

test("collects HTTP imports, namespace aliases, and destructured require bindings", () => {
  const ast = parse(
    'import http from "node:http"; import { get as fetchLocal, createServer, "request" as quotedRequest } from "https"; const { request, Agent, ["get"]: quotedGet } = require("node:https"); const client = await import("http"); const fs = require("node:fs"); const unrelated = load(); const [item] = require("http");',
    { sourceType: "module" },
  );
  expect([...collectHttpBindings(ast)]).toEqual([
    ["http", "node:http"],
    ["fetchLocal", "https"],
    ["quotedRequest", "https"],
    ["request", "node:https"],
    ["quotedGet", "node:https"],
    ["client", "http"],
  ]);
});
