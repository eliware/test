import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findHttpClientViolations } from "../../../../../../../src/validation/harness/test-isolation/find/network/http-client/violations.mjs";

test("rejects external requests from imported and injected HTTP clients", () => {
  const imported = parse('import * as http from "node:http"; http.get("https://example.com");', {
    sourceType: "module",
  });
  const injected = parse(
    'function call(httpClient) { httpClient.request("https://example.com"); }',
  );
  expect(findHttpClientViolations(imported)).toEqual([
    "must mock HTTP client requests, inject a mock client, or use a localhost URL.",
  ]);
  expect(findHttpClientViolations(injected)).toEqual([
    "must mock HTTP client requests, inject a mock client, or use a localhost URL.",
  ]);
});

test("allows localhost requests and explicit HTTP mocks", () => {
  const local = parse('import { request } from "node:https"; request({ hostname: "localhost" });', {
    sourceType: "module",
  });
  const mock = parse(
    'jest.unstable_mockModule("node:http", () => ({})); const http = await import("node:http"); http.get("https://example.com");',
    { sourceType: "module" },
  );
  const spy = parse(
    'function call(httpClient) { jest.spyOn(httpClient, "get"); httpClient.get("https://example.com"); }',
  );
  expect(findHttpClientViolations(local)).toEqual([]);
  expect(findHttpClientViolations(mock)).toEqual([]);
  expect(findHttpClientViolations(spy)).toEqual([]);
  const computed = parse('import * as http from "node:http"; http["get"]("http://[::1]:8080");', {
    sourceType: "module",
  });
  const chained = parse(
    'function call(httpClient) { httpClient.transport.get("https://example.com"); }',
    { sourceType: "module" },
  );
  expect(findHttpClientViolations(computed)).toEqual([]);
  expect(findHttpClientViolations(chained)).toEqual([
    "must mock HTTP client requests, inject a mock client, or use a localhost URL.",
  ]);
  expect(
    findHttpClientViolations(parse('function call(client) { client.get("https://example.com"); }')),
  ).toEqual([]);
});
