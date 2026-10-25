import { expect, test } from "@jest/globals";
import { parse } from "@babel/parser";
import { findFetchViolations } from "../../../../../../src/validation/harness/test-isolation/find/network/fetch-violations.mjs";

const find = (source) => findFetchViolations(parse(source));

test("rejects external and unknown fetch calls", () => {
  expect(find('fetch("https://example.com"); fetch(target);')).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
});

test("allows localhost fetch and rejects malformed URL values", () => {
  expect(find('fetch("http://localhost:3000/health"); fetch("localhost/path");')).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
  expect(find('fetch("http://127.0.0.1"); fetch("http://[::1]");')).toEqual([]);
});

test("recognizes fetch aliases and spies that run before the request", () => {
  expect(
    find('jest.spyOn(globalThis, "fetch"); const request = fetch; request("https://example.com");'),
  ).toEqual([]);
  expect(
    find('const request = fetch; jest.spyOn(globalThis, "fetch"); request("https://example.com");'),
  ).toEqual(["must mock fetch, inject it, or use a localhost URL."]);
  expect(find('fetch("https://example.com"); jest.spyOn(globalThis, "fetch");')).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
});

test("matches spy targets and direct global fetch members", () => {
  expect(find('jest.spyOn(window, "fetch"); window.fetch("https://example.com");')).toEqual([]);
  expect(find('jest.spyOn(window, "fetch"); fetch("https://example.com");')).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
  expect(find('globalThis["fetch"]("https://example.com");')).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
  expect(find('jest.spyOn({}, "fetch"); fetch("https://example.com");')).toEqual([
    "must mock fetch, inject it, or use a localhost URL.",
  ]);
});
